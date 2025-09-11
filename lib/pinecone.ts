// import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
// import { downloadFromS3 } from "./s3-server";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import md5 from "md5";
// import {
//   Document,
//   RecursiveCharacterTextSplitter,
// } from "@pinecone-database/doc-splitter";
// import { getEmbeddings } from "./embeddings";
// import { convertToAscii } from "./utils";

// export const getPineconeClient = () => {
//   return new Pinecone({
//     apiKey: process.env.PINECONE_API_KEY!,
//   });
// };

// type PDFPage = {
//   pageContent: string;
//   metadata: {
//     loc: { pageNumber: number };
//   };
// };

// export async function loadS3IntoPinecone(fileKey: string) {
//   // 1. obtain the pdf -> downlaod and read from pdf
//   console.log("downloading s3 into file system");
//   const file_name = await downloadFromS3(fileKey);
//   if (!file_name) {
//     throw new Error("could not download from s3");
//   }
//   console.log("loading pdf into memory" + file_name);
//   const loader = new PDFLoader(file_name);
//   const pages = (await loader.load()) as PDFPage[];

//   // 2. split and segment the pdf
//   const documents = await Promise.all(pages.map(prepareDocument));

//   // 3. vectorise and embed individual documents
//   const vectors = await Promise.all(documents.flat().map(embedDocument));

//   // 4. upload to pinecone
//   const client = await getPineconeClient();
//   const pineconeIndex = await client.index("med-academy");
//   const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

//   console.log("inserting vectors into pinecone");
//   await namespace.upsert(vectors);

//   return documents[0];
// }

// async function embedDocument(doc: Document) {
//   try {
//     const embeddings = await getEmbeddings(doc.pageContent);
//     const hash = md5(doc.pageContent);

//     return {
//       id: hash,
//       values: embeddings,
//       metadata: {
//         text: doc.metadata.text,
//         pageNumber: doc.metadata.pageNumber,
//       },
//     } as PineconeRecord;
//   } catch (error) {
//     console.log("error embedding document", error);
//     throw error;
//   }
// }

// export const truncateStringByBytes = (str: string, bytes: number) => {
//   const enc = new TextEncoder();
//   return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
// };

// async function prepareDocument(page: PDFPage) {
//   let { pageContent, metadata } = page;
//   pageContent = pageContent.replace(/\n/g, "");
//   // split the docs
//   const splitter = new RecursiveCharacterTextSplitter();
//   const docs = await splitter.splitDocuments([
//     new Document({
//       pageContent,
//       metadata: {
//         pageNumber: metadata.loc.pageNumber,
//         text: truncateStringByBytes(pageContent, 36000),
//       },
//     }),
//   ]);
//   return docs;
// }
// lib/pinecone.ts
// lib/embeddings.ts
// lib/pinecone.ts
// lib/pinecone.ts
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import md5 from "md5";

import { downloadFromS3 } from "./s3-server";
import { getEmbeddings } from "./embeddings";
import { convertToAscii } from "./utils";

// ---- ENV / Tunables ----
const INDEX_NAME = process.env.PINECONE_INDEX ?? "med-academy";
// REQUIRED for serverless indexes (from your screenshot)
const INDEX_HOST = process.env.PINECONE_HOST!;
const UPSERT_BATCH_SIZE = Number(process.env.PINECONE_BATCH ?? 100);
const EMBED_CONCURRENCY = Number(process.env.EMBED_CONCURRENCY ?? 8);
const CHUNK_SIZE = Number(process.env.CHUNK_SIZE ?? 1000);
const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP ?? 150);
const META_BYTES = Number(process.env.METADATA_PREVIEW_BYTES ?? 1000);

export const getPineconeClient = () =>
  new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

type PDFPage = {
  pageContent: string;
  metadata: { loc?: { pageNumber?: number } };
};

function truncateBytes(str: string, bytes: number) {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
}

// minimal concurrency helper
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (t: T, i: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = new Array(Math.min(concurrency, items.length))
    .fill(0)
    .map(async () => {
      while (true) {
        const idx = i++;
        if (idx >= items.length) break;
        out[idx] = await mapper(items[idx], idx);
      }
    });
  await Promise.all(workers);
  return out;
}

async function prepare(page: PDFPage) {
  const content = (page.pageContent || "").replace(/\s+/g, " ").trim();
  if (!content) return [] as Document[];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  return splitter.splitDocuments([
    new Document({
      pageContent: content,
      metadata: {
        pageNumber: page.metadata?.loc?.pageNumber ?? null,
        text: truncateBytes(content, META_BYTES),
      },
    }),
  ]);
}

async function toRecord(doc: Document): Promise<PineconeRecord | null> {
  const text = (doc.pageContent || "").trim();
  if (!text) return null;

  const values = await getEmbeddings(text); // make sure this uses a 1536-dim model (text-embedding-3-small)
  return {
    id: md5(text),
    values,
    metadata: {
      text: (doc.metadata as any)?.text ?? "",
      pageNumber: (doc.metadata as any)?.pageNumber ?? null,
    },
  };
}

async function upsertInBatches(
  ns: ReturnType<ReturnType<Pinecone["index"]>["namespace"]>,
  vecs: PineconeRecord[],
  size: number
) {
  for (let i = 0; i < vecs.length; i += size) {
    const batch = vecs.slice(i, i + size);
    try {
      await ns.upsert(batch);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.toLowerCase().includes("dimension")) {
        throw new Error(
          "PINECONE_DIMENSION_MISMATCH: your index must be 1536 dims for text-embedding-3-small."
        );
      }
      // retry once
      await ns.upsert(batch);
    }
  }
}

export async function loadS3IntoPinecone(fileKey: string) {
  if (!INDEX_HOST) {
    throw new Error(
      "PINECONE_HOST is missing. Set it to the Host URL shown in Pinecone."
    );
  }

  // 1) Download PDF locally
  const localFile = await downloadFromS3(fileKey);

  // 2) Load + split
  const loader = new PDFLoader(localFile);
  const pages = (await loader.load()) as PDFPage[];
  const chunksNested = await Promise.all(pages.map(prepare));
  const chunks = chunksNested.flat();

  // 3) De-dup by content
  const seen = new Set<string>();
  const uniqueDocs: Document[] = [];
  for (const d of chunks) {
    const h = md5(d.pageContent);
    if (!seen.has(h)) {
      seen.add(h);
      uniqueDocs.push(d);
    }
  }

  // 4) Embed with bounded concurrency
  const maybe = await mapWithConcurrency(
    uniqueDocs,
    EMBED_CONCURRENCY,
    toRecord
  );
  const vectors = maybe.filter(Boolean) as PineconeRecord[];
  if (!vectors.length) return { chunks: 0, embedded: 0, upserted: 0 };

  // 5) Connect (serverless requires host) and upsert into a per-file namespace
  const client = getPineconeClient();
  const index = client.index(INDEX_NAME, INDEX_HOST);
  const ns = index.namespace(convertToAscii(fileKey));

  await upsertInBatches(ns, vectors, UPSERT_BATCH_SIZE);

  return {
    chunks: uniqueDocs.length,
    embedded: vectors.length,
    upserted: vectors.length,
  };
}
