// app/data/admin/admin-get-quiz.ts
import "server-only";
import { requireAdmin } from "./require-admin";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const adminGetQuiz = async (id: string) => {
  await requireAdmin();

  const data = await prisma.quiz.findUnique({
    where: { id },
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

      // NEW
      isUnite: true,
      quizModules: {
        select: {
          id: true,
          title: true,
        },
        orderBy: { createdAt: "asc" },
      },

      // unchanged
      cours: {
        select: {
          id: true,
          qcm: {
            select: {
              id: true,
              question: true,
              position: true,
              typeQuestionId: true,
              comment: true,
              other_qcm: {
                select: {
                  id: true,
                  question: true,
                  position: true,
                  typeQuestionId: true,
                  comment: true,
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
              answers: {
                select: {
                  id: true,
                  position: true,
                  isCorrect: true,
                  text: true,
                },
              },
            },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  if (!data) return notFound();
  return data;
};

export type AdminSingleQuizType = Awaited<ReturnType<typeof adminGetQuiz>>;
