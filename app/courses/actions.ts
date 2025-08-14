"use server";

import { prisma } from "@/lib/db";

export async function getLevel(userId: string) {
  if (!userId) {
    return "FIRST_YEAR"; // Default level if userId is not provided
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { level: true },
  });
  return user?.level || "FIRST_YEAR";
}
