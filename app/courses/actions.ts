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

export async function getSetupStatus(userId: string) {
  if (!userId) {
    return false; // Default setup status if userId is not provided
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { setup: true },
  });
  return user?.setup || false;
}

export async function setSetup(userId: string) {
  if (!userId) {
    return;
  }
  await prisma.user.update({
    where: { id: userId },
    data: { setup: true },
  });
}
