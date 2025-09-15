// File: app/api/upload-url/route.ts
// Creates a presigned PUT URL for direct browser-to-Tigris uploads.
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";

export const runtime = "nodejs";

function sanitizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

function guessExt(mime?: string) {
  if (!mime) return "";
  if (mime.includes("png")) return ".png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("gif")) return ".gif";
  return "";
}

export async function POST(req: Request) {
  try {
    const { contentType, filename } = await req.json();

    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
    if (!bucket) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES" },
        { status: 500 }
      );
    }

    // Preferred public base: explicit env for CDN/domain or bucket subdomain
    const explicitPublicBase =
      process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL_IMAGES;
    // Fallback public base: path-style using your S3 endpoint
    const endpoint = (process.env.AWS_ENDPOINT_URL_S3 || "").replace(/\/$/, "");
    const fallbackPublicBase = endpoint ? `${endpoint}/${bucket}` : "";

    const publicBase = explicitPublicBase || fallbackPublicBase;
    if (!publicBase) {
      return NextResponse.json(
        {
          error:
            "No public base URL. Set NEXT_PUBLIC_S3_PUBLIC_BASE_URL_IMAGES or AWS_ENDPOINT_URL_S3.",
        },
        { status: 500 }
      );
    }

    const safeName = sanitizeName(filename || "image");
    const ext = safeName.includes(".") ? "" : guessExt(contentType);
    const key = `uploads/${new Date()
      .toISOString()
      .slice(0, 10)}/${crypto.randomUUID()}-${safeName}${ext}`;

    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || "application/octet-stream",
      // If your bucket policy requires it, you could add:
      // ACL: "public-read",
    });

    const putUrl = await getSignedUrl(S3, cmd, { expiresIn: 60 }); // 60 seconds
    const publicUrl = `${publicBase}/${encodeURI(key)}`;

    return NextResponse.json({ putUrl, key, publicUrl, bucket });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
