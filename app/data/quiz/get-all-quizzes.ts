import { prisma } from "@/lib/db";

export const getAllQuizzes = async () => {
  const data = await prisma.quiz.findMany({
    where: {
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,

      level: true,
      category: true,
      fileKey: true,
      slug: true,
      price: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
};

export type PublicQuizzesType = Awaited<ReturnType<typeof getAllQuizzes>>;
export type PublicQuizType = PublicQuizzesType[number];
