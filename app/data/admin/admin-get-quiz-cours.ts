import { prisma } from "@/lib/db";

export async function getQuizCourses(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      cours: {
        select: {
          id: true,
          title: true,
          quizId: true,
          quizModuleId: true,
        },
      },
    },
  });
  return quiz?.cours || [];
}

export type AdminGetQuizCourses = Awaited<ReturnType<typeof getQuizCourses>>;
export type AdminGetQuizCoursesCours = AdminGetQuizCourses[number];
