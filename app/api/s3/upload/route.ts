import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { v4 as uuid } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";

import { requireAdmin } from "@/app/data/admin/require-admin";

const uploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
  size: z.number().min(1, "File size must be greater than 0"),
  isImage: z.boolean(),
});

const aj = arcjet
  .withRule(
    detectBot({
      mode: "LIVE",
      allow: [],
    })
  )
  .withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 5,
    })
  );

export const POST = async (request: Request) => {
  const session = await requireAdmin();
  try {
    const body = await request.json();

    const decision = await aj.protect(request, {
      fingerprint: session?.user.id || "",
    });

    const validation = uploadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "invalid request data" },
        { status: 400 }
      );
    }

    if (decision.isDenied()) {
      return NextResponse.json(
        {
          error: "Request denied",
        },
        {
          status: 429,
        }
      );
    }

    const { fileName, contentType, size } = validation.data;
    const uniqueKey = `${uuid()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      ContentType: contentType,
      Key: uniqueKey,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 360,
    });
    const response = {
      presignedUrl,
      uniqueKey,
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
};
