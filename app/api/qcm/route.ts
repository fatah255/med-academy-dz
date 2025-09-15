// app/api/qcm/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import useConstructUrl from "@/hooks/use-construct-url";

export const runtime = "nodejs";

/** Request body */
const BodySchema = z.object({
  chatId: z.string().min(1),
  count: z.number().int().min(1).max(50).default(5),
  difficulty: z.enum(["easy", "normal", "hard"]).default("normal"),
  language: z.string().optional().default("fr"), // change default if you want
});

/** Expected QCM structure */
const QcmSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string(),
        question: z.string(),
        difficulty: z.enum(["easy", "normal", "hard"]).optional(),
        choices: z.array(
          z.object({
            id: z.string(),
            text: z.string(),
            correct: z.boolean(),
          })
        ),
        explanation: z.string().optional(),
      })
    )
    .min(1),
});
type QcmPayload = z.infer<typeof QcmSchema>;

function extractJsonSafe(s: string): unknown {
  // some models may wrap JSON in fences; strip them and parse
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw = fence ? fence[1] : s;
  // try direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // try to find first {...}
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(raw.slice(first, last + 1));
    }
    throw new Error("Model did not return valid JSON.");
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUser();
    const userId = session.user.id;

    const body = await req.json();
    const { chatId, count, difficulty, language } = BodySchema.parse(body);

    // verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: { id: true, pdfFileKey: true },
    });
    if (!chat) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const pdfUrl = useConstructUrl(chat.pdfFileKey);

    // Build a strict JSON schema the model must follow
    const jsonSchema = {
      name: "qcm_list",
      strict: true,
      schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            minItems: count,
            maxItems: count,
            items: {
              type: "object",
              required: ["id", "question", "choices"],
              additionalProperties: false,
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
                    required: ["id", "text", "correct"],
                    additionalProperties: false,
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
        required: ["questions"],
        additionalProperties: false,
      },
    };

    const prompt = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `From the attached PDF, generate ${count} multiple-choice questions in ${language}.
- Difficulty: ${difficulty}.
- Each question must have exactly 4 choices with exactly one correct answer.
- Keep questions concise and unambiguous.
- Include a short explanation for the correct answer.
- Return ONLY JSON matching the provided schema.`,
          },
          {
            type: "file",
            file: {
              filename: "document.pdf",
              file_data: pdfUrl, // public URL
            },
          },
        ],
      },
    ];

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY!}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.BETTER_AUTH_URL || "http://localhost",
        "X-Title": "Med Academy - QCM generator",
      },
      body: JSON.stringify({
        // choose your model; free or paid
        model: "openai/gpt-4o-mini",
        messages: prompt,
        max_tokens: 1500,
        response_format: {
          type: "json_schema",
          json_schema: jsonSchema,
        },
        plugins: [
          {
            id: "file-parser",
            pdf: { engine: "pdf-text" },
          },
        ],
      }),
    });

    if (!resp.ok) {
      const errTxt = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: "upstream_error", message: errTxt || resp.statusText },
        { status: 502 }
      );
    }

    const data = await resp.json();

    // OpenRouter returns content as a string when using JSON schema
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "bad_response", message: "No content from model" },
        { status: 502 }
      );
    }

    const parsed = extractJsonSafe(
      typeof content === "string" ? content : String(content)
    );
    const qcm = QcmSchema.parse(parsed) as QcmPayload;

    // optional: persist QCM to DB if you want
    // await prisma.generatedQcm.create({ data: { chatId, payload: qcm as any } });

    return NextResponse.json(qcm, { status: 200 });
  } catch (err: any) {
    console.log("QCM error", err);
    const message = err?.message || "Unexpected error";
    return NextResponse.json({ error: "internal", message }, { status: 500 });
  }
}
