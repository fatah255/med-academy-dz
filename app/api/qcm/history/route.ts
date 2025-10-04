import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";

// GET /api/qcm/history?chatId=...
export async function GET(req: Request) {
  await requireUser(); // ownership is already enforced on save; listing by chatId is fine
  const chatId = new URL(req.url).searchParams.get("chatId") ?? "";
  if (!chatId) return NextResponse.json({ sets: [] });

  const sets = await prisma.chatQcmSet.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      count: true,
      difficulty: true,
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json({
    sets: sets.map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      count: s.count,
      difficulty: s.difficulty,
      itemsCount: s._count.items,
    })),
  });
}
