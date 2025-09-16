// app/api/s3/uploadPdf/route.ts
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { S3 } from "@/lib/S3Client";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { userHasActiveAI } from "@/lib/subscription";

export const runtime = "nodejs";

const uploadSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1), // expect application/pdf
  size: z.number().min(1),
  isImage: z.boolean(), // will be false for PDFs
});

export async function POST(request: Request) {
  const session = await requireUser();
  let window = "1440m";

  const allowed = await userHasActiveAI(session.user.id);

  if (allowed) {
    window = "1m";
  }

  const aj = arcjet
    .withRule(detectBot({ mode: "LIVE", allow: [] }))
    .withRule(fixedWindow({ mode: "LIVE", window, max: 4 }));
  try {
    const decision = await aj.protect(request, {
      fingerprint: session.user.id || "anon",
    });
    if (decision.isDenied()) {
      return NextResponse.json(
        {
          error:
            "You can only upload 3 PDFs per Day , upgrade for unlimited uploads",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = uploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { fileName, contentType } = parsed.data;
    // (optional) enforce PDF
    if (!/^application\/pdf$/i.test(contentType)) {
      return NextResponse.json({ error: "Only PDF allowed" }, { status: 400 });
    }

    const key = `${uuid()}-${fileName}`;

    const cmd = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES!, // <— set this in env
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(S3, cmd, { expiresIn: 120 });
    return NextResponse.json({ presignedUrl, uniqueKey: key });
  } catch (err: any) {
    if (err?.name === "AuthError" || err?.code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("uploadPdf route error:", err);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
