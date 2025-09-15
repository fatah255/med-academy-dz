"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function deleteAttempt(attemptId: string) {
  // Optional: add auth/ownership checks here.
  try {
    await prisma.quizAttempt.delete({
      where: { id: attemptId },
    });
    // Refresh the attempts list
    revalidatePath("/dashboard/attempts");
    return { ok: true };
  } catch (err) {
    console.error("Failed to delete attempt", err);
    return { ok: false, error: "Failed to delete attempt." };
  }
}
