import "server-only";
import { requireAdmin } from "./require-admin";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const adminGetQuiz = async (id: string) => {
  await requireAdmin();
  const data = await prisma.quiz.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      fileKey: true,

      level: true,
      category: true,
      description: true,
      price: true,
      status: true,
      qcm: {
        select: {
          id: true,
          question: true,
          position: true,
          answers: {
            select: {
              id: true,
              position: true,
              isCorrect: true,
              text: true,
            },
          },
        },
      },
    },
  });

  if (!data) {
    return notFound();
  }
  return data;
};

export type AdminSingleQuizType = Awaited<ReturnType<typeof adminGetQuiz>>;
