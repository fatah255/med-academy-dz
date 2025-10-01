"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";

type ApiResponse = { status: "success" | "error"; message: string };

export async function setCoursModule(params: {
  quizId: string;
  coursId: string;
  moduleId: string | null;
}): Promise<ApiResponse> {
  const { quizId, coursId, moduleId } = params;

  const admin = await requireAdmin();

  try {
    // Load quiz (must be unite)
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, isUnite: true, userId: true },
    });

    if (!quiz) return { status: "error", message: "Quiz not found" };
    if (!quiz.isUnite)
      return { status: "error", message: "Quiz is not a unite" };

    // Cours must belong to this quiz
    const course = await prisma.cours.findUnique({
      where: { id: coursId },
      select: { id: true, quizId: true },
    });
    if (!course || course.quizId !== quizId) {
      return { status: "error", message: "Cours doesn't belong to this quiz" };
    }

    // If assigning a module, it must belong to this quiz too
    if (moduleId) {
      const mod = await prisma.quizmodule.findUnique({
        where: { id: moduleId },
        select: { id: true, quizId: true },
      });
      if (!mod || mod.quizId !== quizId) {
        return {
          status: "error",
          message: "Module doesn't belong to this quiz",
        };
      }
    }

    await prisma.cours.update({
      where: { id: coursId },
      data: { quizModuleId: moduleId ?? null },
    });

    revalidatePath(`/admin/quizzes/${quizId}/edit`);
    return { status: "success", message: "Module updated" };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "Something went wrong" };
  }
}
