import MCQ from "@/app/quizzes/_components/QCM";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import ClientQCM from "../_components/ClientQCM";

const page = async ({
  params,
  searchParams,
}: {
  params: Promise<{ quizId: string }>;
  searchParams: { ques: string };
}) => {
  const { quizId } = await params;
  const numberOfQuestions = searchParams.ques;

  const data = await prisma.quiz.findUnique({
    where: { id: quizId },

    select: {
      qcm: {
        select: {
          question: true,
          answers: {
            select: {
              text: true,
              isCorrect: true,
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });
  if (!data) {
    return notFound();
  }
  const shuffledData = data.qcm.sort(() => Math.random() - 0.5);
  const requiredData = shuffledData.slice(
    0,
    parseInt(numberOfQuestions, 10) || 5
  );
  const questions = requiredData.map((q) => ({
    question: q.question,
    options: q.answers.map((a) => a.text),
    correctIndex: q.answers.findIndex((a) => a.isCorrect),
  }));
  return (
    <ClientQCM
      game={{
        id: "hhhh",
        topic: "Test Quiz",
        timeStarted: new Date(),
        questions,
      }}
    />
  );
};

export default page;
