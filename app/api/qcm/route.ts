// app/api/qcm/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import useConstructUrl from "@/hooks/use-construct-url";

// --- tiny helper: fetch URL -> data: URL ---
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
  count: z.number().int().min(1).max(50).default(5),
  difficulty: z.enum(["easy", "normal", "hard"]).default("normal"),
  language: z.string().default("fr"),
});

// Final shape
const QcmSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string(),
        question: z.string(),
        difficulty: z.enum(["easy", "normal", "hard"]).optional(),
        choices: z
          .array(
            z.object({ id: z.string(), text: z.string(), correct: z.boolean() })
          )
          .length(4),
        explanation: z.string().optional(),
      })
    )
    .min(1),
});
type QcmPayload = z.infer<typeof QcmSchema>;

// Extract JSON even if fenced
function extractJsonSafe(s: string): any {
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw = fence ? fence[1] : s;
  try {
    return JSON.parse(raw);
  } catch {
    const i = raw.indexOf("{");
    const j = raw.lastIndexOf("}");
    if (i >= 0 && j > i) return JSON.parse(raw.slice(i, j + 1));
    throw new Error("Model did not return valid JSON.");
  }
}

// Normalize loose outputs -> exact schema
function normalizeToQcmShape(input: any, expectedCount: number): QcmPayload {
  let qArr: any[] =
    input?.questions ?? input?.items ?? input?.data?.questions ?? [];
  if (!Array.isArray(qArr)) throw new Error("No questions[] in model output.");
  qArr = qArr.slice(0, expectedCount);

  const letters = ["A", "B", "C", "D"];

  const questions = qArr.map((q: any) => {
    const id = String(q?.id ?? crypto.randomUUID());
    const question = String(
      q?.question ?? q?.prompt ?? q?.title ?? q?.text ?? ""
    ).trim();

    const difficultyRaw = (q?.difficulty ?? q?.level ?? "")
      .toString()
      .toLowerCase();
    const difficulty = ["easy", "normal", "hard"].includes(difficultyRaw)
      ? (difficultyRaw as any)
      : undefined;

    let choicesRaw: any[] = q?.choices ?? q?.options ?? q?.answers ?? [];
    if (!Array.isArray(choicesRaw)) choicesRaw = [];

    // convert strings -> objects
    let choices = choicesRaw.map((c: any) =>
      typeof c === "string"
        ? { id: crypto.randomUUID(), text: c, correct: false }
        : {
            id: String(c?.id ?? crypto.randomUUID()),
            text: String(c?.text ?? c?.label ?? c ?? ""),
            correct: Boolean(c?.correct ?? c?.isCorrect ?? false),
          }
    );

    // detect/mark correct
    const ansLetter = String(q?.answer ?? q?.key ?? "")
      .trim()
      .toUpperCase();
    const idxFromLetter = letters.includes(ansLetter)
      ? letters.indexOf(ansLetter)
      : -1;
    const idx =
      typeof q?.correctIndex === "number"
        ? q.correctIndex
        : typeof q?.answerIndex === "number"
        ? q.answerIndex
        : idxFromLetter;

    if (idx >= 0 && idx < choices.length) {
      choices = choices.map((c, i) => ({ ...c, correct: i === idx }));
    }

    // if none marked, default first to true
    if (!choices.some((c) => c.correct) && choices.length)
      choices[0].correct = true;

    // exactly 4 choices
    choices = choices.slice(0, 4);
    while (choices.length < 4) {
      choices.push({ id: crypto.randomUUID(), text: "—", correct: false });
    }

    const explanation = q?.explanation ?? q?.rationale ?? q?.why;
    return { id, question, difficulty, choices, explanation };
  });

  return { questions };
}

// OpenRouter call (with good headers)
async function callOpenRouter(payload: any) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.BETTER_AUTH_URL || "http://localhost",
      "X-Title": "Med Academy - QCM generator",
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

    // ownership + pdf url
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: { pdfFileKey: true, pdfName: true },
    });
    if (!chat)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ALWAYS send as data URL to avoid "Invalid content"
    const pdfUrl = useConstructUrl(chat.pdfFileKey);
    const dataUrl = await pdfToDataUrlFromUrl(pdfUrl);

    const system =
      "You generate multiple-choice questions strictly from the attached PDF. Return ONLY JSON, no prose.";

    const instruction = [
      `Generate ${count} QCM questions in ${language}. Difficulty: ${difficulty}.`,
      "Each question has exactly 4 choices and exactly one correct answer.",
      "Include a short 'explanation' for the correct answer.",
      "Return only JSON that matches the schema.",
    ].join("\n");

    const messages = [
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

    const model = "openai/gpt-4o-mini"; // supports structured outputs

    // 1) strict schema
    const payloadSchema = {
      model,
      messages,
      max_tokens: Math.max(1200, 300 * count),
      temperature: 0.2,
      plugins: [{ id: "file-parser", pdf: { engine: "pdf-text" } }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "qcm_list",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["questions"],
            properties: {
              questions: {
                type: "array",
                minItems: count,
                maxItems: count,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["id", "question", "choices"],
                  properties: {
                    id: { type: "string" },
                    question: { type: "string" },
                    difficulty: {
                      type: "string",
                      enum: ["easy", "normal", "hard"],
                    },
                    choices: {
                      type: "array",
                      minItems: 4,
                      maxItems: 4,
                      items: {
                        type: "object",
                        additionalProperties: false,
                        required: ["id", "text", "correct"],
                        properties: {
                          id: { type: "string" },
                          text: { type: "string" },
                          correct: { type: "boolean" },
                        },
                      },
                    },
                    explanation: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    };

    let data;
    try {
      data = await callOpenRouter(payloadSchema);
    } catch (e: any) {
      // 2) fallback if provider rejects schema / "Invalid content"
      if (
        e?.status === 400 ||
        String(e?.message || "").includes("Invalid content")
      ) {
        const payloadFallback = {
          model,
          messages: [
            messages[0],
            {
              ...messages[1],
              content: [
                {
                  type: "text",
                  text:
                    instruction +
                    "\n\nReturn a single JSON object with questions[].",
                },
                (messages[1] as any).content[1], // the file
              ],
            },
          ],
          max_tokens: Math.max(1200, 300 * count),
          temperature: 0.2,
          plugins: [{ id: "file-parser", pdf: { engine: "pdf-text" } }],
          response_format: { type: "json_object" },
        };
        data = await callOpenRouter(payloadFallback);
      } else {
        throw e;
      }
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "bad_response", message: "No content" },
        { status: 502 }
      );
    }

    const raw = extractJsonSafe(
      typeof content === "string" ? content : String(content)
    );
    const normalized = normalizeToQcmShape(raw, count);
    const qcm = QcmSchema.parse(normalized);

    // --- SAVE QCM SET (added; non-breaking) ---
    try {
      const itemsToCreate = qcm.questions.map((q) => {
        const correctIndex = q.choices.findIndex((c) => c.correct);
        return {
          question: q.question,
          choices: q.choices.map((c) => c.text), // TEXT[] in CockroachDB
          correctIndex: correctIndex >= 0 ? correctIndex : 0,
          explanation: q.explanation ?? null,
        };
      });

      await prisma.chatQcmSet.create({
        data: {
          chatId,
          count,
          difficulty, // stored as string (matches your model suggestion)
          items: {
            create: itemsToCreate,
          },
        },
      });
    } catch (persistErr) {
      // Do not block client if persistence fails
      console.error("QCM persist error (non-fatal):", persistErr);
    }

    // unchanged response
    return NextResponse.json(qcm, { status: 200 });
  } catch (err: any) {
    console.log("QCM error", err);
    return NextResponse.json(
      { error: "internal", message: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
