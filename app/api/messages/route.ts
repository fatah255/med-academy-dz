// app/api/messages/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  const limit = Number(searchParams.get("limit") ?? "20");
  const cursor = searchParams.get("cursor"); // last id from previous page

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  const session = await requireUser();
  const userId = session.user.id;

  // verify ownership
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId },
    select: { id: true },
  });
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await prisma.chatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" }, // newest first
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const nextCursor = items.length === limit ? items[items.length - 1].id : null;

  const messages = items.map((m) => ({
    id: m.id,
    createdAt: m.createdAt.toISOString(),
    text: m.content,
    // ⚠️ adjust this line if your enum uses "AI" instead of "ASSISTANT".
    isUserMessage: m.role === "USER",
  }));

  return NextResponse.json({ messages, nextCursor });
}
