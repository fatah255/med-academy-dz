// app/api/message/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import useConstructUrl from "@/hooks/use-construct-url";
export const runtime = "nodejs"; // we need Node runtime for Prisma + streaming

type ORSSE = {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index?: number;
    delta?: { content?: string };
    message?: { content?: string };
  }>;
};

export async function POST(req: Request) {
  try {
    const { fileId, message } = (await req.json()) as {
      fileId: string;
      message: string;
    };
    const session = await requireUser();
    const userId = session.user.id;

    const chat = await prisma.chat.findFirst({
      where: { id: fileId, userId },
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
        content: message,
        role: "USER",
      },
    });

    // 2) (optional) include short history for context
    const history = await prisma.chatMessage.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: "asc" },
      take: 30,
    });

    const openRouterMessages = [
      ...history.map((m) => ({
        role: m.role === "USER" ? "user" : "assistant",
        content: m.content,
      })),
      {
        role: "user",
        content: [
          { type: "text", text: message },
          {
            type: "file",
            file: {
              filename: chat.pdfName ?? "document.pdf",
              file_data: fileUrl,
            },
          },
        ],
      },
    ];

    // 3) Call OpenRouter with streaming
    const model =
      process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-405b-instruct:free";
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: openRouterMessages,
        // ensure PDF parsing
        plugins: [{ id: "file-parser", pdf: { engine: "pdf-text" } }],
        max_tokens: 1500,
      }),
    });

    if (!orRes.ok || !orRes.body) {
      const err = await orRes.text().catch(() => "");
      return new NextResponse(err || "OpenRouter error", { status: 502 });
    }

    // 4) Transform SSE → plain text stream; also buffer to save to DB at end
    const encoder = new TextEncoder();
    let buffer = "";
    let carry = ""; // carry over partial lines between chunks

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
          // 5) Save assistant message at the end
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
// app/api/message/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/db";
// import { requireUser } from "@/app/data/user/require-user";
// import useConstructUrl from "@/hooks/use-construct-url";

// export const runtime = "nodejs";

// export async function POST(req: Request) {
//   const body = await req.json().catch(() => null);
//   const chatId = body?.chatId as string | undefined;
//   const message = body?.message as string | undefined;

//   if (!chatId || !message?.trim()) {
//     return NextResponse.json(
//       { error: "chatId and message are required" },
//       { status: 400 }
//     );
//   }

//   const session = await requireUser();
//   const userId = session.user.id;

//   // verify ownership + get pdf key
//   const chat = await prisma.chat.findFirst({
//     where: { id: chatId, userId },
//     select: { id: true, pdfFileKey: true },
//   });
//   if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

//   const pdfUrl = useConstructUrl(chat.pdfFileKey);

//   // Persist the user's message
//   const userMsgId = crypto.randomUUID();
//   await prisma.chatMessage.create({
//     data: {
//       id: userMsgId,
//       chatId,
//       content: message,
//       // ⚠️ match your Prisma enum (USER / ASSISTANT). If your enum is USER/AI, change below.
//       role: "USER" as any,
//     },
//   });

//   // Call OpenRouter (non-streaming is simpler; your client still "streams" a single chunk).
//   const model =
//     process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-405b-instruct:free";
//   const headers = {
//     Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//     "Content-Type": "application/json",
//   };

//   const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//     method: "POST",
//     headers,
//     body: JSON.stringify({
//       model,
//       max_tokens: 800,
//       messages: [
//         {
//           role: "user",
//           content: [
//             { type: "text", text: message },
//             {
//               type: "file",
//               file: {
//                 filename: "document.pdf",
//                 file_data: pdfUrl,
//               },
//             },
//           ],
//         },
//       ],
//       plugins: [{ id: "file-parser", pdf: { engine: "pdf-text" } }],
//       // stream: true, // You can enable later and proxy SSE if you want true token streaming.
//     }),
//   });

//   if (!orRes.ok) {
//     const text = await orRes.text().catch(() => "OpenRouter error");
//     return NextResponse.json({ error: text }, { status: 500 });
//   }

//   const data = await orRes.json().catch(() => null);
//   // OpenRouter returns either string or array — normalize to string
//   let aiText = "";
//   try {
//     const c = data?.choices?.[0]?.message?.content;
//     aiText = Array.isArray(c)
//       ? c.map((p: any) => (typeof p === "string" ? p : p?.text ?? "")).join("")
//       : c ?? "";
//   } catch {
//     aiText = "";
//   }
//   aiText ||= "Sorry, I couldn't generate a response.";

//   // Persist AI reply
//   const aiMsgId = crypto.randomUUID();
//   await prisma.chatMessage.create({
//     data: {
//       id: aiMsgId,
//       chatId,
//       content: aiText,
//       role: "SYSTEM",
//     },
//   });

//   // Return a readable stream so your client can incrementally read it
//   const encoder = new TextEncoder();
//   const stream = new ReadableStream({
//     start(controller) {
//       controller.enqueue(encoder.encode(aiText));
//       controller.close();
//     },
//   });

//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/plain; charset=utf-8",
//       "Cache-Control": "no-cache",
//     },
//   });
// }
