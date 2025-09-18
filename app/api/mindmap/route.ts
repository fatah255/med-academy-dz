export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import useConstructUrl from "@/hooks/use-construct-url";
import { z } from "zod";
import { pdfToDataUrlFromUrl } from "@/lib/pdf-to-data-url";

type Mode = "resumed" | "detailed";

const MapifySchema = z.object({
  topic: z.string().min(2),
  markdown: z.string().min(2),
});

export async function POST(req: Request) {
  try {
    const { chatId, mode }: { chatId: string; mode?: Mode } = await req.json();
    if (!chatId)
      return NextResponse.json(
        { error: "chatId is required" },
        { status: 400 }
      );

    const detail: Mode = mode === "detailed" ? "detailed" : "resumed";

    const session = await requireUser();
    const userId = session.user.id;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: { pdfFileKey: true, pdfName: true },
    });
    if (!chat)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const fileUrl = useConstructUrl(chat.pdfFileKey);
    const dataUrl = await pdfToDataUrlFromUrl(fileUrl);

    // —— Prompt tuned for Mapify-like output ——
    const depthHint =
      detail === "resumed"
        ? "Use # + ##. Keep it concise."
        : "Use # for title, ## for branches, and ### for sub-branches. Every ## branch MUST contain 3–7 ### sub-branches (no bullets). Optionally add a few #### leaves if helpful.";

    const systemPrompt =
      "Return STRICT JSON only: { topic: string, markdown: string }. " +
      "Markdown MUST contain headings only (#, ##, ###, optional ####). No lists/paragraphs/tables/code.";

    const userPrompt = `
You are a helpful assistant that generates well-structured mind maps.
Please generate a Mind Map as Markdown text for the attached PDF content.

Rules:
- Use headings: # for title, ## for branch, ### for sub-branch.
- Avoid boilerplate like "Overview" or "Conclusion".
- Prefer specific, factual nodes—not just categories.
- If a list would exceed 6 items, compress into a single branch with a comma-separated enumeration.
- ${depthHint}

Return JSON exactly as:
{
  "topic": "{Good title without the words 'Mind Map'}",
  "markdown": "# {same title}\\n## Branch 1\\n### Sub A\\n..."
}`;

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "missing_api_key", message: "OPENROUTER_API_KEY not set" },
        { status: 500 }
      );
    }

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
                    file_data: dataUrl,
                  },
                },
              ],
            },
          ],
          plugins: [{ id: "file-parser", pdf: { engine: "pdf-text" } }],
          response_format: { type: "json_object" },
          max_tokens: detail === "detailed" ? 3200 : 1600,
          temperature: 0.4,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      return NextResponse.json(
        { error: "openrouter_error", message: err || response.statusText },
        { status: 502 }
      );
    }

    const data = await response.json();
    let raw = data?.choices?.[0]?.message?.content ?? "";

    // Defensive parse: model should already return JSON, but handle strings.
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

    const doc = MapifySchema.parse(parsed);
    return NextResponse.json({ mode: detail, doc }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "internal_server_error", message: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
