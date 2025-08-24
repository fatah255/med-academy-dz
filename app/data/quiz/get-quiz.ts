import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const getQuiz = async (slug: string) => {
  const quiz = await prisma.quiz.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,

      description: true,

      level: true,
      category: true,
      fileKey: true,
      slug: true,
      price: true,
      qcm: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!quiz) {
    return notFound();
  }

  return quiz;
};
