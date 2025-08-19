import "server-only";
import { requireUser } from "./require-user";
import { prisma } from "@/lib/db";

export async function getInrolledQuizzes() {
  const user = await requireUser();

  const data = await prisma.enrollment.findMany({
    where: {
      userId: user.user.id,
      quizId: {
        not: null,
      },
      status: {
        in: ["PAID", "paid"],
      },
    },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          description: true,

          fileKey: true,
          slug: true,
          level: true,
          category: true,

          qcm: {
            select: {
              id: true,
              question: true,
              answers: {
                select: {
                  id: true,
                  position: true,
                  text: true,
                  isCorrect: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return data;
}

export type EnrolledQuizType = Awaited<
  ReturnType<typeof getInrolledQuizzes>
>[number];
