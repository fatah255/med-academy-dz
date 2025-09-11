// import { OpenAIApi, Configuration } from "openai-edge";

// const config = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(config);

// export async function getEmbeddings(text: string) {
//   try {
//     const response = await openai.createEmbedding({
//       model: "text-embedding-ada-002",
//       input: text.replace(/\n/g, " "),
//     });
//     const result = await response.json();
//     return result.data[0].embedding as number[];
//   } catch (error) {
//     console.log("error calling openai embeddings api", error);
//     throw error;
//   }
// }
// lib/embeddings.ts
// lib/embeddings.ts
import OpenAI from "openai";

const PROVIDER = (process.env.EMBED_PROVIDER ?? "openai").toLowerCase();
// OpenAI: 1536-dim (small) is fast; large = 3072-dim
const OPENAI_MODEL = process.env.EMBED_MODEL ?? "text-embedding-3-small";
// Jina: 768-dim base (English). See https://cloud.jina.ai/
const JINA_MODEL = process.env.JINA_MODEL ?? "jina-embeddings-v2-base-en";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getEmbeddings(text: string): Promise<number[]> {
  const input = (text || "").replace(/\s+/g, " ").trim();
  if (!input) throw new Error("getEmbeddings: empty input");

  // Force provider by env
  if (PROVIDER === "jina") return getJinaEmbeddings(input);

  // Default: OpenAI with graceful quota/rate-limit handling,
  // auto-fallback to Jina if key is present.
  try {
    const resp = await openai.embeddings.create({ model: OPENAI_MODEL, input });
    const emb = resp.data?.[0]?.embedding;
    if (!emb)
      throw new Error(`OpenAI: empty embedding: ${JSON.stringify(resp)}`);
    return emb as number[];
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.includes("insufficient_quota")) {
      if (process.env.JINA_API_KEY) {
        // fallback to Jina automatically
        return getJinaEmbeddings(input);
      }
      throw new Error("EMBEDDINGS_QUOTA_EXCEEDED");
    }
    if (msg.toLowerCase().includes("rate limit")) {
      throw new Error("EMBEDDINGS_RATE_LIMIT");
    }
    throw e;
  }
}

async function getJinaEmbeddings(input: string): Promise<number[]> {
  const res = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.JINA_API_KEY}`,
    },
    body: JSON.stringify({ input, model: JINA_MODEL }),
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`JINA_ERROR_${res.status}: ${raw}`);

  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Jina: non-JSON response: ${raw.slice(0, 400)}`);
  }
  const emb = json?.data?.[0]?.embedding;
  if (!emb)
    throw new Error(`Jina: no embedding in response: ${raw.slice(0, 400)}`);
  return emb as number[];
}

/** Useful if you want to validate Pinecone index dimension */
export function currentEmbeddingDim(): number {
  if ((process.env.EMBED_PROVIDER ?? "openai").toLowerCase() === "jina")
    return 768;
  const m = process.env.EMBED_MODEL ?? "text-embedding-3-small";
  if (m.includes("3-large")) return 3072;
  return 1536; // text-embedding-3-small
}
