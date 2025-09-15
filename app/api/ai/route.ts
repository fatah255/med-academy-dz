// File: app/api/ai/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ascii = (s: string) => s.replace(/[^\x20-\x7E]/g, "");

export async function POST(req: Request) {
  try {
    const {
      messages,
      model = "google/gemini-2.0-flash-001",
      stream = false,
    } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY" },
        { status: 500 }
      );
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": ascii(process.env.APP_URL || "http://localhost:3000"),
        "X-Title": ascii("Med Academy - Image Chat"),
      },
      body: JSON.stringify({ model, messages, stream }),
    });

    if (!stream) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
