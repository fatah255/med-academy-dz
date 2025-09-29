import "server-only";
import { requireUser } from "./require-user";
import { prisma } from "@/lib/db";

export async function getEnrolledQuizzes() {
  const user = await requireUser();

  const paidEnrollments = await prisma.enrollment.findMany({
    where: {
      userId: user.user.id,
      quizId: { not: null },
      status: { in: ["PAID", "paid"] },
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
          // ⚠️ No cours/qcm here — defer to modal fetch
        },
      },
    },
  });

  const freeQuizzes = await prisma.quiz.findMany({
    where: { price: 0 },
    select: {
      id: true,
      title: true,
      description: true,
      fileKey: true,
      slug: true,
      level: true,
      category: true,
      // ⚠️ No cours/qcm here either
    },
  });

  const freeQuizzesObjects = freeQuizzes.map((q) => ({ quiz: { ...q } }));
  return [...paidEnrollments, ...freeQuizzesObjects];
}

export type EnrolledQuizType = Awaited<
  ReturnType<typeof getEnrolledQuizzes>
>[number];
