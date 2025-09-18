import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import useConstructUrl from "@/hooks/use-construct-url";

// --- url -> data: url (same as your QCM route) ---
async function pdfToDataUrlFromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch PDF");
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:application/pdf;base64,${buf.toString("base64")}`;
}

export const runtime = "nodejs";

// Request
const BodySchema = z.object({
  chatId: z.string().min(1),
  count: z.number().int().min(1).max(100).default(12),
  difficulty: z.enum(["easy", "normal", "hard"]).default("normal"),
  language: z.string().default("fr"),
});

// Output
const FlashcardsSchema = z.object({
  cards: z
    .array(
      z.object({
        id: z.string(),
        front: z.string(),
        back: z.string(),
        hint: z.string().optional(),
        difficulty: z.enum(["easy", "normal", "hard"]).optional(),
      })
    )
    .min(1),
});
type FlashcardsPayload = z.infer<typeof FlashcardsSchema>;

// Extract JSON even if fenced
function extractJsonSafe(s: string): any {
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw = fence ? fence[1] : s;
  try {
    return JSON.parse(raw);
  } catch {
    const i = raw.indexOf("{"),
      j = raw.lastIndexOf("}");
    if (i >= 0 && j > i) return JSON.parse(raw.slice(i, j + 1));
    const ai = raw.indexOf("["),
      aj = raw.lastIndexOf("]");
    if (ai >= 0 && aj > ai) return JSON.parse(raw.slice(ai, aj + 1));
    throw new Error("Model did not return valid JSON");
  }
}

// Normalize loose shapes -> { cards[] }
function normalizeToFlashcards(
  input: any,
  expectedCount: number
): FlashcardsPayload {
  let arr: any[] = [];

  if (Array.isArray(input)) arr = input;
  if (!arr.length) {
    arr =
      input?.cards ??
      input?.items ??
      input?.data?.cards ??
      input?.data ??
      input?.deck ??
      [];
    if (!Array.isArray(arr) && arr && typeof arr === "object")
      arr = Object.values(arr);
  }

  // Accept QCM-like and convert
  if ((!arr || !arr.length) && Array.isArray(input?.questions)) {
    arr = input.questions.map((q: any) => {
      const correct =
        (q?.choices || q?.answers || []).find(
          (c: any) => c?.correct || c?.isCorrect
        )?.text ?? "";
      return {
        id: String(q?.id ?? crypto.randomUUID()),
        front: String(q?.question ?? q?.prompt ?? "").trim(),
        back: String(q?.explanation ?? correct ?? "").trim(),
        difficulty: (q?.difficulty ?? q?.level) as any,
      };
    });
  }

  arr = (Array.isArray(arr) ? arr : []).slice(0, expectedCount);

  const cards = arr
    .map((c: any) => ({
      id: String(c?.id ?? crypto.randomUUID()),
      front: String(c?.front ?? c?.question ?? c?.q ?? "").trim(),
      back: String(c?.back ?? c?.answer ?? c?.a ?? c?.definition ?? "").trim(),
      hint: c?.hint ? String(c.hint) : undefined,
      difficulty: (["easy", "normal", "hard"].includes(String(c?.difficulty))
        ? c?.difficulty
        : undefined) as any,
    }))
    .filter((c) => c.front && c.back);

  return { cards };
}

// OpenRouter call
async function callOpenRouter(payload: any) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.BETTER_AUTH_URL || "http://localhost",
      "X-Title": "Med Academy - Flashcard generator",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(text || res.statusText) as any;
    err.status = res.status;
    throw err;
  }
  return JSON.parse(text);
}

export async function POST(req: Request) {
  try {
    const session = await requireUser();
    const userId = session.user.id;

    const body = await req.json();
    const { chatId, count, difficulty, language } = BodySchema.parse(body);

    // Verify ownership & get PDF URL
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: { pdfFileKey: true, pdfName: true },
    });
    if (!chat)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const pdfUrl = useConstructUrl(chat.pdfFileKey);

    // ---------- Messages (FILE attempt) ----------
    const dataUrl = await pdfToDataUrlFromUrl(pdfUrl);

    const system =
      "You create flashcards strictly from the attached PDF. Return ONLY JSON.";
    const instruction = [
      `Generate ${count} concise flashcards in ${language}. Difficulty: ${difficulty}.`,
      "Each card has { id, front, back, hint? }.",
      "FRONT: short prompt/term. BACK: precise answer/definition.",
      "Use only information present in the PDF.",
      "Return ONLY JSON with a top-level 'cards' array.",
    ].join("\n");

    const messagesWithFile = [
      { role: "system" as const, content: [{ type: "text", text: system }] },
      {
        role: "user" as const,
        content: [
          { type: "text", text: instruction },
          {
            type: "file",
            file: {
              filename: chat.pdfName ?? "document.pdf",
              file_data: dataUrl,
            },
          },
        ],
      },
    ];

    const model = "openai/gpt-4o-mini";

    // Try 1: strict schema with FILE (same pattern as your QCM route)
    const payloadSchemaWithFile = {
      model,
      messages: messagesWithFile,
      max_tokens: Math.max(1200, 200 * count),
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "flashcards",
          strict: true,
          schema: {
            type: "object",
            required: ["cards"],
            additionalProperties: false,
            properties: {
              cards: {
                type: "array",
                minItems: count,
                maxItems: count,
                items: {
                  type: "object",
                  required: ["id", "front", "back"],
                  additionalProperties: false,
                  properties: {
                    id: { type: "string" },
                    front: { type: "string" },
                    back: { type: "string" },
                    hint: { type: "string" },
                    difficulty: {
                      type: "string",
                      enum: ["easy", "normal", "hard"],
                    },
                  },
                },
              },
            },
          },
        },
      },
    } as const;

    let data: any;
    let contentStr = "";

    try {
      data = await callOpenRouter(payloadSchemaWithFile);
      const content = data?.choices?.[0]?.message?.content;
      contentStr =
        typeof content === "string" ? content : String(content ?? "");
    } catch (e: any) {
      // ---------- AUTO-FALLBACK: pass the PDF URL as TEXT (no file) ----------
      const isFileUnsupported =
        e?.status === 400 &&
        /does not support file content types|Invalid Value: 'file'|messages\[1\]\.content\[\d+\]\.type/i.test(
          String(e?.message || "")
        );

      if (!isFileUnsupported) throw e;

      const messagesWithLink = [
        { role: "system" as const, content: [{ type: "text", text: system }] },
        {
          role: "user" as const,
          content: [
            {
              type: "text",
              text:
                instruction +
                `\n\nPDF URL (read this document to generate the cards): ${pdfUrl}\n` +
                "If you cannot fetch the URL, rely on any available context and return best-effort JSON.",
            },
          ],
        },
      ];

      // Try 2a: schema with LINK
      const payloadSchemaWithLink = {
        model,
        messages: messagesWithLink,
        max_tokens: Math.max(1200, 200 * count),
        temperature: 0.2,
        response_format: { type: "json_object" }, // json_object is more widely honored when links are used
      } as const;

      try {
        data = await callOpenRouter(payloadSchemaWithLink);
        const content = data?.choices?.[0]?.message?.content;
        contentStr =
          typeof content === "string" ? content : String(content ?? "");
      } catch (e2: any) {
        // Try 2b: ultra-plain instruction
        const payloadPlain = {
          model,
          messages: [
            {
              role: "system" as const,
              content: [{ type: "text", text: system }],
            },
            {
              role: "user" as const,
              content: [
                {
                  type: "text",
                  text:
                    `Return ONLY this JSON shape (no prose): {"cards":[{"id":"...","front":"...","back":"..."}]}\n` +
                    `Generate exactly ${count} cards in ${language}. Difficulty: ${difficulty}.` +
                    `\nPDF URL: ${pdfUrl}`,
                },
              ],
            },
          ],
          max_tokens: Math.max(1200, 200 * count),
          temperature: 0.2,
          response_format: { type: "json_object" },
        } as const;
        data = await callOpenRouter(payloadPlain);
        const content = data?.choices?.[0]?.message?.content;
        contentStr =
          typeof content === "string" ? content : String(content ?? "");
      }
    }

    if (!contentStr) {
      return NextResponse.json(
        { error: "bad_response", message: "No content" },
        { status: 502 }
      );
    }

    const parsed = extractJsonSafe(contentStr);
    const normalized = normalizeToFlashcards(parsed, count);

    if (!normalized.cards.length) {
      return NextResponse.json(
        {
          error: "no_cards_generated",
          message: "The model did not return any flashcards.",
          debug: contentStr.slice(0, 400),
        },
        { status: 422 }
      );
    }

    const ok = FlashcardsSchema.parse(normalized);
    return NextResponse.json(ok, { status: 200 });
  } catch (err: any) {
    console.error("Flashcards error", err);
    return NextResponse.json(
      { error: "internal", message: err?.message || "Unexpected" },
      { status: 500 }
    );
  }
}
