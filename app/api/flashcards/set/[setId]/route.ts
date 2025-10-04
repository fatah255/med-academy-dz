import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ setId: string }> }
) {
  const session = await requireUser();
  const setId = (await params).setId;
  const set = await prisma.chatFlashcardSet.findUnique({
    where: { id: setId },
    select: {
      id: true,
      chatId: true,
      createdAt: true,
      items: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: set.id,
    createdAt: set.createdAt.toISOString(),
    cards: set.items.map((i) => ({
      id: i.id,
      front: i.front,
      back: i.back,
      hint: i.hint ?? undefined,
    })),
  });
}
