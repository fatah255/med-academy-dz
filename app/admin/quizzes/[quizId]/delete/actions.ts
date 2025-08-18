"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

const aj = arcjet
  .withRule(
    detectBot({
      mode: "LIVE",
      allow: [],
    })
  )
  .withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 1,
    })
  );

export const deleteQuiz = async (quizId: string): Promise<ApiResponse> => {
  const user = await requireAdmin();
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: user?.user.id || "",
  });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Request denied",
    };
  }

  try {
    await prisma.quiz.delete({
      where: { id: quizId },
    });
    revalidatePath(`/admin/quizzes`);
    return {
      status: "success",
      message: "Quiz deleted successfully",
    };
  } catch (error) {
    return {
      status: "error",
      message: "Something went wrong while deleting the quiz",
    };
  }
};
