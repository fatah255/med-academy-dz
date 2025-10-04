import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";

// GET /api/mindmap/history?chatId=...
export async function GET(req: Request) {
  await requireUser();
  const chatId = new URL(req.url).searchParams.get("chatId") ?? "";
  if (!chatId) return NextResponse.json({ sets: [] });

  const rows = await prisma.chatMindmap.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, mode: true, topic: true },
  });

  return NextResponse.json({
    sets: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      mode: r.mode,
      topic: r.topic,
    })),
  });
}
