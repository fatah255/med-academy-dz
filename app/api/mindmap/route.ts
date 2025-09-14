// app/api/mindmap/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import useConstructUrl from "@/hooks/use-construct-url";
import { z } from "zod";

type Mode = "resumed" | "detailed";

type MindMapNode = {
  title: string;
  note?: string;
  children?: MindMapNode[];
};

type MindMap = {
  title: string;
  children?: MindMapNode[];
};

const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";
const MODEL =
  process.env.OPENROUTER_MINDMAP_MODEL ?? "meta-llama/llama-3.1-70b-instruct";

// ---------- Zod validation (recursive) ----------
const MindNodeSchema: z.ZodType<MindMapNode> = z.lazy(() =>
  z.object({
    title: z.string().min(1),
    note: z.string().optional(),
    children: z.array(MindNodeSchema).optional(),
  })
);

const MindMapSchema = z.object({
  title: z.string().min(1),
  children: z.array(MindNodeSchema).optional(),
});

export async function POST(req: Request) {
  try {
    const { chatId, mode }: { chatId: string; mode?: Mode } = await req.json();
    if (!chatId) {
      return NextResponse.json(
        { error: "chatId is required" },
        { status: 400 }
      );
    }
    const detail: Mode = mode === "detailed" ? "detailed" : "resumed";

    const session = await requireUser();
    const userId = session.user.id;

    // Check ownership and fetch file key/name
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: { pdfFileKey: true, pdfName: true },
    });
    if (!chat)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const fileUrl = useConstructUrl(chat.pdfFileKey);

    const depthHint =
      detail === "resumed"
        ? "Keep the hierarchy concise (max ~2 levels under root) with the most important topics."
        : "Provide a deeper outline (up to ~4 levels when meaningful) with organized subtopics.";

    const systemPrompt = [
      "You are a careful reading assistant that extracts a clean hierarchical mind map from a PDF.",
      "Use the document's language. Titles are short noun phrases; notes are 1 concise sentence.",
      "Exclude noise (TOCs, headers/footers, page numbers). Avoid duplicates.",
      "Return ONLY JSON with { title: string, children?: Node[] } and Node { title, note?, children? }.",
    ].join(" ");

    const userPrompt = [
      `Create a ${detail} mind map for the attached PDF.`,
      depthHint,
      "Root 'title' is the document topic; children are subtopics in logical order.",
    ].join("\n");

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "missing_api_key", message: "OPENROUTER_API_KEY not set" },
        { status: 500 }
      );
    }

    const response = await fetch(OPENROUTER_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "file",
                file: {
                  filename: chat.pdfName ?? "document.pdf",
                  file_data: fileUrl, // public URL for file-parser
                },
              },
            ],
          },
        ],
        // IMPORTANT: avoid recursive json_schema -> ask for plain JSON
        response_format: "json_object",
        plugins: [{ id: "file-parser", pdf: { engine: "pdf-text" } }],
        max_tokens: detail === "detailed" ? 4000 : 1800,
        temperature: detail === "detailed" ? 0.4 : 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return NextResponse.json(
        { error: "openrouter_error", message: errText || response.statusText },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Extract JSON from the model output
    let raw = data?.choices?.[0]?.message?.content ?? "";

    // If it's already an object, keep it; otherwise parse string (strip ```json fences if present)
    let parsed: unknown = raw;
    if (typeof raw === "string") {
      const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
      if (fenced) raw = fenced[1];
      try {
        parsed = JSON.parse(raw);
      } catch {
        // last-resort brace slicing
        const i = raw.indexOf("{");
        const j = raw.lastIndexOf("}");
        if (i >= 0 && j > i) parsed = JSON.parse(raw.slice(i, j + 1));
      }
    }

    // Validate with Zod
    const mindmap = MindMapSchema.parse(parsed) as MindMap;

    return NextResponse.json({ mode: detail, mindmap }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "internal_server_error", message: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
