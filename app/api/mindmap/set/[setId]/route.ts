import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";

// GET /api/mindmap/set/:setId
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ setId: string }> }
) {
  await requireUser();
  const row = await prisma.chatMindmap.findUnique({
    where: { id: (await params).setId },
    select: { id: true, createdAt: true, topic: true, markdown: true },
  });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    doc: { topic: row.topic, markdown: row.markdown },
  });
}
