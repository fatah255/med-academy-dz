import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";

// GET /api/flashcards/history?chatId=...
export async function GET(req: Request) {
  const session = await requireUser();
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId") ?? "";
  if (!chatId) return NextResponse.json({ sets: [] });

  const sets = await prisma.chatFlashcardSet.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      count: true,
      difficulty: true,
      language: true,
      _count: { select: { items: true } },
    },
  });
  return NextResponse.json({
    sets: sets.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      itemsCount: s._count.items,
    })),
  });
}
