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
  const numberOfQuestions = parseInt(resolvedSearchParams?.ques ?? "", 10) || 5;

  const data = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      title: true,
      price: true,
      qcm: {
        select: {
          id: true, // <-- include id
          question: true,
          answers: {
            select: { text: true, isCorrect: true },
            orderBy: { position: "asc" }, // keep answers in intended order
          },
        },
        orderBy: { position: "asc" }, // keep questions in intended order
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

  if (!enrollment && data.price > 0) {
    return notFound();
  }

  // Optional shuffle (copy first to avoid mutating `data.qcm`)
  const shuffled = [...data.qcm].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, numberOfQuestions);

  const questions = picked.map((q) => ({
    id: q.id, // <-- required by ClientQCM
    question: q.question,
    options: q.answers.map((a) => a.text),
    correctIndices: q.answers
      .map((a, i) => (a.isCorrect ? i : -1))
      .filter((i) => i >= 0),
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
