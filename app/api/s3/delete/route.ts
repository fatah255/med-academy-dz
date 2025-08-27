import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { S3 } from "@/lib/S3Client";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { env } from "@/lib/env";

const aj = arcjet
  .withRule(detectBot({ mode: "LIVE", allow: [] }))
  .withRule(fixedWindow({ mode: "LIVE", window: "1m", max: 30 }));

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  try {
    const session = await requireAdmin(); // moved inside try like upload

    // rate-limit / anti-bot
    const decision = await aj.protect(request, {
      fingerprint: session.user.id || "anon",
    });
    if (decision.isDenied()) {
      return NextResponse.json(
        { error: decision.reason || "Rate limited" },
        { status: 429 }
      );
    }

    // parse request
    const body = await request.json();
    const { key } = body;
    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    // delete file
    const cmd = new DeleteObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: key,
    });

    await S3.send(cmd);
    return NextResponse.json({ message: "File deleted successfully" });
  } catch (err: any) {
    // translate auth errors to 401/403
    if (err?.name === "AuthError" || err?.code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("delete route error:", err);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
