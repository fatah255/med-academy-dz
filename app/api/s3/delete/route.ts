import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { S3 } from "@/lib/S3Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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
      max: 30,
    })
  );

export const DELETE = async (request: Request) => {
  const session = await requireAdmin();
  try {
    const body = await request.json();

    const decision = await aj.protect(request, {
      fingerprint: session?.user.id || "",
    });

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
    const { key } = body;
    if (!key) {
      return new Response("Key is required", { status: 400 });
    }

    const command = new DeleteObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: key,
    });

    await S3.send(command);
    return new Response("File deleted successfully", { status: 200 });
  } catch (error) {}
};
