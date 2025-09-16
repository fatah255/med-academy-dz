import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ascii = (s: string) => s.replace(/[^\x20-\x7E]/g, "");

export async function POST(req: Request) {
  try {
    const {
      messages,
      model = "openai/gpt-4o-mini", // ✅ streaming + vision
      stream = true, // ✅ stream by default
    } = await req.json();

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY" },
        { status: 500 }
      );
    }

    const upstream = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          // 👇 these help prevent buffering and nudge SSE behavior
          Accept: stream ? "text/event-stream" : "application/json",
          "HTTP-Referer": ascii(process.env.APP_URL || "http://localhost:3000"),
          "X-Title": ascii("Med Academy - Image Chat"),
        },
        body: JSON.stringify({ model, messages, stream }),
      }
    );

    // Non-streaming: just pass JSON back
    if (!stream) {
      const data = await upstream.json();
      return NextResponse.json(data);
    }

    // Streaming: pipe SSE through
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
