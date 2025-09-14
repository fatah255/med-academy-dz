// app/api/chat/create-chat/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";

// Prisma needs Node runtime (not Edge)
export const runtime = "nodejs";
// Ensure this route is never statically optimized/cached
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  file_key: z.string().min(1, "file_key is required"),
  file_name: z.string().min(1, "file_name is required"),
});

export async function POST(req: Request) {
  // Auth
  const session = await requireUser();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Parse & validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { file_key, file_name } = parsed.data;

  try {
    // (Blocking) ingest to Pinecone. If you prefer backgrounding this,
    // move it to a queue/job and return the chat id immediately.

    // Create chat record
    const chat = await prisma.chat.create({
      data: {
        userId,
        pdfFileKey: file_key,
        pdfName: file_name,
      },
      select: { id: true },
    });

    return NextResponse.json({ chat_id: chat.id }, { status: 200 });
  } catch (err: any) {
    const msg = String(err?.message ?? err);

    console.error("create-chat error:", err);
    return NextResponse.json(
      { error: "internal_server_error", message: msg },
      { status: 500 }
    );
  }
}
