// import { S3 } from "@aws-sdk/client-s3";
// import { pipeline } from "stream/promises";
// import { Readable } from "stream";
// import fs from "fs";
// import path from "path";
// import os from "os";

// export const runtime = "nodejs";

// export async function downloadFromS3(file_key: string): Promise<string> {
//   const s3 = new S3({
//     region: process.env.AWS_REGION!,
//     credentials: {
//       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//     },
//   });

//   // Use the right bucket for PDFs
//   const Bucket =
//     process.env.NEXT_PUBLIC_S3_BUCKET_NAME_PDF ??
//     process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES!;

//   const { Body } = await s3.getObject({ Bucket, Key: file_key });

//   // Cross-platform temp file (e.g. C:\Users\<you>\AppData\Local\Temp)
//   const tmpDir = os.tmpdir();
//   const filePath = path.join(tmpDir, `elliott-${Date.now()}.pdf`);

//   // Node Readable stream
//   if (Body instanceof Readable) {
//     await pipeline(Body, fs.createWriteStream(filePath));
//     return filePath;
//   }

//   // Web ReadableStream (edge adapters sometimes return this)
//   if (Body && typeof (Body as any).getReader === "function") {
//     const nodeStream = Readable.fromWeb(Body as any);
//     await pipeline(nodeStream, fs.createWriteStream(filePath));
//     return filePath;
//   }

//   // Buffer/Uint8Array
//   if (Body instanceof Uint8Array || Buffer.isBuffer(Body)) {
//     await fs.promises.writeFile(filePath, Buffer.from(Body as Uint8Array));
//     return filePath;
//   }

//   // Async iterable fallback
//   if (Body && Symbol.asyncIterator in (Body as any)) {
//     const chunks: Buffer[] = [];
//     for await (const chunk of Body as any) chunks.push(Buffer.from(chunk));
//     await fs.promises.writeFile(filePath, Buffer.concat(chunks));
//     return filePath;
//   }

//   throw new Error("Unsupported S3 Body type");
// }
// lib/s3-server.ts
import { S3 } from "@aws-sdk/client-s3";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import os from "os";

export async function downloadFromS3(file_key: string): Promise<string> {
  const s3 = new S3({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  // Pick the correct bucket env for PDFs
  const Bucket =
    process.env.NEXT_PUBLIC_S3_BUCKET_NAME_PDF ??
    process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES!;

  const { Body } = await s3.getObject({ Bucket, Key: file_key });

  // Cross-platform temp file
  const tmpPath = path.join(os.tmpdir(), `medacademy-${Date.now()}.pdf`);

  // Node Readable
  if (Body instanceof Readable) {
    await pipeline(Body, fs.createWriteStream(tmpPath));
    return tmpPath;
  }

  // Web ReadableStream
  if (Body && typeof (Body as any).getReader === "function") {
    const nodeStream = Readable.fromWeb(Body as any);
    await pipeline(nodeStream, fs.createWriteStream(tmpPath));
    return tmpPath;
  }

  // Buffer/Uint8Array
  if (Body instanceof Uint8Array || Buffer.isBuffer(Body)) {
    await fs.promises.writeFile(tmpPath, Buffer.from(Body as Uint8Array));
    return tmpPath;
  }

  // Async iterable fallback
  if (Body && Symbol.asyncIterator in (Body as any)) {
    const chunks: Buffer[] = [];
    for await (const chunk of Body as any) chunks.push(Buffer.from(chunk));
    await fs.promises.writeFile(tmpPath, Buffer.concat(chunks));
    return tmpPath;
  }

  throw new Error("Unsupported S3 Body type");
}
