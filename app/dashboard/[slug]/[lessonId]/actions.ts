"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function markLessonAsCompleted(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const session = await requireUser();
  const userId = session.user.id;

  try {
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },

      update: {
        completed: true,
      },
      create: {
        userId,
        lessonId,
        completed: true,
      },
    });

    revalidatePath(`/dashboard/${slug}`);

    return {
      status: "success",
      message: "Lesson marked as completed successfully",
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to mark lesson as completed",
    };
  }
}
