import "server-only";
import { requireUser } from "./require-user";
import { prisma } from "@/lib/db";

export async function getEnrolledQuizzes() {
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
          cours: {
            select: {
              title: true,
              id: true,

              qcm: {
                select: {
                  id: true,
                  examYear: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const freeQuizzes = await prisma.quiz.findMany({
    where: {
      price: 0,
    },

    select: {
      id: true,
      title: true,
      description: true,

      fileKey: true,
      slug: true,
      level: true,
      category: true,
      cours: {
        select: {
          id: true,
          title: true,
          qcm: {
            select: {
              id: true,
              examYear: true,
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

  const freeQuizzesObjects = freeQuizzes.map((q) => ({
    quiz: {
      ...q,
    },
  }));

  const finalData = [...data, ...freeQuizzesObjects];

  return finalData;
}

export type EnrolledQuizType = Awaited<
  ReturnType<typeof getEnrolledQuizzes>
>[number];
