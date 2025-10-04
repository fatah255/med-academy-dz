"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function listChats() {
  const session = await requireUser();
  return prisma.chat.findMany({
    where: { userId: session.user.id },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      pdfName: true,
      createdAt: true,
      _count: { select: { chatMessage: true } },
    },
  });
}

export async function createChat() {
  const session = await requireUser();
  // Create an empty placeholder chat; you can pre-fill pdf fields if you want.
  const chat = await prisma.chat.create({
    data: {
      userId: session.user.id,
      pdfName: "New Chat",
      pdfFileKey: "", // fill after upload if needed
    },
    select: { id: true },
  });

  revalidatePath("/dashboard/ai");
  redirect(`/dashboard/ai/${chat.id}`);
}

export async function deleteChat(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.chat.delete({ where: { id } });
  revalidatePath("/dashboard/ai");
}
