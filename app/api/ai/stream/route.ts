// File: app/api/ai/stream/route.ts  (optional SSE endpoint)
export const runtime = "edge";

const ascii = (s: string) => s.replace(/[^\x20-\x7E]/g, "");

export async function POST(req: Request) {
  const { messages, model = "google/gemini-2.0-flash-001" } = await req.json();

  const upstream = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY!}`,
        "Content-Type": "application/json",
        "HTTP-Referer": ascii(process.env.APP_URL || "http://localhost:3000"),
        "X-Title": ascii("Med Academy - Image Chat"),
      },
      body: JSON.stringify({ model, stream: true, messages }),
    }
  );

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
