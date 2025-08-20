import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export const adminGetQuizzes = async () => {
  await requireAdmin();
  const data = await prisma.quiz.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      status: true,
      price: true,
      fileKey: true,
      level: true,
      category: true,
      qcm: {
        select: {
          id: true,
        },
      },
    },
  });
  return data;
};

export type AdminQuizType = Awaited<ReturnType<typeof adminGetQuizzes>>[number];
