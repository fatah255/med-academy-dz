import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ClientQCM from "../_components/ClientQCM";
import { v4 } from "uuid";
import { requireUser } from "@/app/data/user/require-user";

type PageProps = {
  params: Promise<{ quizId: string }>; // Promise in Next.js 15
  searchParams: Promise<{ ques?: string }>; // Also Promise in Next.js 15
};

export default async function Page({ params, searchParams }: PageProps) {
  const { quizId } = await params;
  const session = await requireUser();
  const resolvedSearchParams = await searchParams;
  // Temporary hardcoded coursId, replace with actual logic to get the relevant coursId
  const numberOfQuestions = parseInt(resolvedSearchParams?.ques ?? "", 10) || 5;

  const data = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      title: true,
      price: true,
      cours: {
        select: {
          id: true,
          title: true,
          qcm: {
            select: {
              id: true, // <-- include id
              question: true,
              comment: true,
              typeQuestionId: true,
              type: true,
              examYear: true,
              answers: {
                select: { text: true, isCorrect: true },
                orderBy: { position: "asc" }, // keep answers in intended order
              },
              other_qcm: {
                select: {
                  id: true, // <-- include id
                  question: true,
                  comment: true,
                  type: true,
                  typeQuestionId: true,
                  answers: {
                    select: { text: true, isCorrect: true },
                    orderBy: { position: "asc" }, // keep answers in intended order
                  },
                },
              },
            },
            orderBy: { position: "asc" }, // keep questions in intended order
          },
        },
      },
    },
  });

  if (!data) return notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_quizId: {
        userId: session.user.id,
        quizId: quizId,
      },
    },
  });
  //just to test

  // if (!enrollment && data.price > 0) {
  //   return notFound();
  // }

  // Optional shuffle (copy first to avoid mutating `data.qcm`)
  const coursId = data.cours[3]?.id; // Temporary, replace with actual logic
  const shuffled = [
    ...data.cours.filter((c) => c.id === coursId).flatMap((c) => c.qcm),
  ].sort(() => Math.random() - 0.5);
  // const picked = shuffled.slice(0, numberOfQuestions);
  const picked = [...shuffled];

  const questions = picked.map((q) => ({
    id: q.id, // <-- required by ClientQCM
    question: q.question,
    year: q.examYear ?? undefined,
    type: q.type ?? undefined,
    typeId: q.typeQuestionId ?? undefined,
    comment: q.comment ?? undefined,

    // root answers (will be [] for clinique stems, which is fine)
    options: q.answers.map((a) => a.text),
    correctIndices: q.answers
      .map((a, i) => (a.isCorrect ? i : -1))
      .filter((i) => i >= 0),

    // sub-questions for clinique (typeId >= 5)
    subQuestions: (q.other_qcm ?? []).map((sq) => ({
      id: sq.id,
      question: sq.question,
      typeId: sq.typeQuestionId ?? undefined,
      comment: sq.comment ?? undefined,
      options: sq.answers.map((a) => a.text),
      correctIndices: sq.answers
        .map((a, i) => (a.isCorrect ? i : -1))
        .filter((i) => i >= 0),
      // If you need year/type for subs, also select them in adminGetQuiz and add:
      // year: sq.examYear ?? undefined,
      // type: sq.type ?? undefined,
    })),
  }));

  const gameId = v4(); // Generate a new UUID for the game

  return (
    <ClientQCM
      game={{
        id: gameId,
        topic: data.title ?? "Test Quiz",
        timeStarted: new Date().toISOString(),
        questions,
      }}
    />
  );
}
