export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import useConstructUrl from "@/hooks/use-construct-url";
import { z } from "zod";
import { pdfToDataUrlFromUrl } from "@/lib/pdf-to-data-url";

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

    // Verify ownership & fetch the PDF key/name
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: { pdfFileKey: true, pdfName: true },
    });
    if (!chat)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Construct your storage URL, then convert to base64 data URL so the provider
    // never needs to fetch it across the network (avoids "Invalid content").
    const publicOrSignedUrl = useConstructUrl(chat.pdfFileKey);
    const dataUrl = await pdfToDataUrlFromUrl(publicOrSignedUrl);

    const depthHint =
      detail === "resumed"
        ? "Keep the hierarchy concise (max ~2 levels under root) with the most important topics."
        : "Provide a deeper outline (up to ~4 levels when meaningful) with organized subtopics.";

    const systemPrompt =
      "You are a careful reading assistant that extracts a clean hierarchical mind map from a PDF. " +
      "Use the document's language. Titles are short noun phrases; notes are one concise sentence. " +
      "Exclude noise (TOCs, headers/footers, page numbers). Avoid duplicates. " +
      "Return ONLY JSON with { title: string, children?: Node[] } and Node { title, note?, children? }.";

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

    // Use a tolerant route (you can swap to any model you prefer).
    const model = "openai/gpt-4o-mini";

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          // Make EVERY message use "content" parts (prevents provider quirks)
          messages: [
            { role: "system", content: [{ type: "text", text: systemPrompt }] },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "file",
                  file: {
                    filename: chat.pdfName ?? "document.pdf",
                    file_data: dataUrl, // base64 data URL, not an external link
                  },
                },
              ],
            },
          ],
          plugins: [{ id: "file-parser", pdf: { engine: "pdf-text" } }],
          // Proper OpenAI-style shape for JSON output
          response_format: { type: "json_object" },
          max_tokens: detail === "detailed" ? 4000 : 1800,
          temperature: detail === "detailed" ? 0.4 : 0.2,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return NextResponse.json(
        { error: "openrouter_error", message: errText || response.statusText },
        { status: 502 }
      );
    }

    const data = await response.json();

    // The response should already be a JSON object (given response_format),
    // but we defensively handle string outputs too.
    let raw = data?.choices?.[0]?.message?.content ?? "";

    let parsed: unknown = raw;
    if (typeof raw === "string") {
      const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
      if (fenced) raw = fenced[1];
      try {
        parsed = JSON.parse(raw);
      } catch {
        const i = raw.indexOf("{");
        const j = raw.lastIndexOf("}");
        if (i >= 0 && j > i) parsed = JSON.parse(raw.slice(i, j + 1));
      }
    }

    const mindmap = MindMapSchema.parse(parsed) as MindMap;

    return NextResponse.json({ mode: detail, mindmap }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "internal_server_error", message: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
