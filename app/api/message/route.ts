// app/api/message/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import useConstructUrl from "@/hooks/use-construct-url";

export const runtime = "nodejs"; // Prisma needs Node

type ORSSE = {
  choices?: Array<{
    delta?: { content?: string };
    message?: { content?: string };
  }>;
};

// Uniform content part helper
const txt = (text: string) => [{ type: "text", text }];

// Robust: accept both shapes from your clients
type BodyA = { chatId?: string; fileId?: string; message?: string };
type BodyB = {
  chatId?: string;
  fileId?: string;
  messages?: { role: "user" | "assistant" | "system"; content: string }[];
};
type Body = BodyA | BodyB;

// Turn a (signed/private) PDF URL into a base64 data URL, so OpenRouter
// doesn't need to fetch your storage URL directly.
async function pdfToDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok)
    throw new Error(`PDF fetch failed: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:application/pdf;base64,${buf.toString("base64")}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    // ✅ accept chatId or fileId; prefer chatId
    const chatId = body.chatId || body.fileId;
    if (!chatId) {
      return NextResponse.json(
        { error: "chatId (or fileId) is required" },
        { status: 400 }
      );
    }

    // extract the user prompt from either shape
    let userMessage = (body as BodyA).message?.trim() ?? "";
    if (!userMessage && (body as BodyB).messages?.length) {
      const lastUser = [...(body as BodyB).messages!]
        .reverse()
        .find((m) => m.role === "user");
      userMessage = lastUser?.content?.trim() ?? "";
    }
    if (!userMessage) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const session = await requireUser();
    const userId = session.user.id;

    // strict: fetch THIS chat for THIS user only
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: { id: true, pdfFileKey: true, pdfName: true },
    });
    if (!chat)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const fileUrl = useConstructUrl(chat.pdfFileKey);

    // 1) Save user message
    await prisma.chatMessage.create({
      data: {
        id: crypto.randomUUID(),
        chatId: chat.id,
        content: userMessage,
        role: "USER",
      },
    });

    // 2) Load short history ONLY for this chat
    const history = await prisma.chatMessage.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: "asc" },
      take: 30,
    });

    // 3) Build OpenRouter messages — ALL as arrays (prevents Invalid content)
    const baseMessages = [
      {
        role: "system" as const,
        content: txt(
          "You are a study assistant. Use ONLY the attached PDF for answers. If a question is unrelated to the PDF, say so."
        ),
      },
      ...history.map((m) => ({
        role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: txt(m.content),
      })),
    ];

    // Always attach the correct PDF with the current prompt (simple & reliable).
    // If you want to attach it only on the first turn, you can detect that by
    // checking if any non-USER messages exist in history.
    const dataUrl = await pdfToDataUrl(fileUrl);

    const openRouterMessages = [
      ...baseMessages,
      {
        role: "user",
        content: [
          { type: "text", text: userMessage },
          {
            type: "file",
            file: {
              filename: chat.pdfName ?? "document.pdf",
              file_data: dataUrl, // base64 data URL => no external fetch by provider
            },
          },
        ],
      },
    ];

    const model = "openai/gpt-4o-mini";

    const headers: Record<string, string> = {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    };

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        stream: true,
        messages: openRouterMessages,
        plugins: [{ id: "file-parser", pdf: { engine: "pdf-text" } }],
        max_tokens: 1500,
      }),
    });

    if (!orRes.ok || !orRes.body) {
      const err = await orRes.text().catch(() => "");
      return new NextResponse(err || "OpenRouter error", { status: 502 });
    }

    // 4) Stream SSE → client; buffer to store the assistant reply at the end
    const encoder = new TextEncoder();
    let buffer = "";
    let carry = "";

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = orRes.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });

            carry += chunk;
            const lines = carry.split(/\r?\n/);
            carry = lines.pop() ?? ""; // keep incomplete line

            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (data === "[DONE]") continue;

              try {
                const json: ORSSE = JSON.parse(data);
                const delta =
                  json.choices?.[0]?.delta?.content ??
                  json.choices?.[0]?.message?.content ??
                  "";

                if (delta) {
                  buffer += delta;
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                /* ignore bad lines */
              }
            }
          }
        } finally {
          controller.close();
          if (buffer.trim().length) {
            await prisma.chatMessage.create({
              data: {
                id: crypto.randomUUID(),
                chatId: chat.id,
                content: buffer,
                role: "SYSTEM",
              },
            });
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
