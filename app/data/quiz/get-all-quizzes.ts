import { getLevel } from "@/app/(landing-page)/courses/actions";
import { prisma } from "@/lib/db";
export const getAllQuizzes = async (userId: string) => {
  if (userId) {
    const level = await getLevel(userId);
    const data = await prisma.quiz.findMany({
      where: {
        status: "PUBLISHED",
        level: level,
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
  } else {
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
  }
};

export type PublicQuizzesType = Awaited<ReturnType<typeof getAllQuizzes>>;
export type PublicQuizType = PublicQuizzesType[number];
