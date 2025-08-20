import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ClientQCM from "../_components/ClientQCM";

type PageProps = {
  params: { quizId: string }; // not a Promise
  searchParams: { ques?: string }; // optional
};

export default async function Page({ params, searchParams }: PageProps) {
  const { quizId } = params;
  const numberOfQuestions = parseInt(searchParams?.ques ?? "", 10) || 5;

  const data = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      title: true,
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

  return (
    <ClientQCM
      game={{
        id: "hhhh", // or crypto.randomUUID()
        topic: data.title ?? "Test Quiz",
        timeStarted: new Date().toISOString(),
        questions,
      }}
    />
  );
}
