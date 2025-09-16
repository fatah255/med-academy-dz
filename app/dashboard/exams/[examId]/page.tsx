import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ClientQCM from "../../quizzes/_components/ClientQCM";
import { v4 as uuidv4 } from "uuid";
import { userHasActiveOfferForQuiz } from "@/lib/subscription";

const Page = async ({ params }: { params: Promise<{ examId: string }> }) => {
  const { examId } = await params;
  const session = await requireUser();
  const examLevel = await prisma.exams.findFirst({
    where: { id: examId },
    select: { level: true, title: true },
  });
  if (!examLevel) return notFound();
  const hasOffer = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      OR: [{ isOffer: true }, { offer: true }],
      status: { in: ["PAID", "paid"] },
      quiz: { level: examLevel.level },
    },
    select: { quizId: true },
  });
  const allowed = await userHasActiveOfferForQuiz(
    session.user.id,
    hasOffer?.quizId || ""
  );
  if (!hasOffer?.quizId || !allowed) {
    return notFound();
  }
  const picked = await prisma.qcm.findMany({
    where: { examId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      question: true,
      comment: true,
      typeQuestionId: true,
      type: true,
      examYear: true,
      answers: {
        select: { text: true, isCorrect: true },
        orderBy: { position: "asc" },
      },
      other_qcm: {
        select: {
          id: true,
          question: true,
          comment: true,
          type: true,
          typeQuestionId: true,
          // examYear: true, // include if you want it on subs
          answers: {
            select: { text: true, isCorrect: true },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });
  const gameId = uuidv4();
  const questions = picked.map((q) => ({
    id: q.id,
    question: q.question,
    year: q.examYear ?? undefined,
    type: q.type ?? undefined,
    typeId: q.typeQuestionId ?? undefined,
    comment: q.comment ?? undefined,

    options: q.answers.map((a) => a.text),
    correctIndices: q.answers
      .map((a, i) => (a.isCorrect ? i : -1))
      .filter((i) => i >= 0),

    subQuestions: (q.other_qcm ?? []).map((sq) => ({
      id: sq.id,
      question: sq.question,
      typeId: sq.typeQuestionId ?? undefined,
      comment: sq.comment ?? undefined,
      options: sq.answers.map((a) => a.text),
      correctIndices: sq.answers
        .map((a, i) => (a.isCorrect ? i : -1))
        .filter((i) => i >= 0),
      // year: sq.examYear ?? undefined,
      // type: sq.type ?? undefined,
    })),
  }));

  return (
    <ClientQCM
      game={{
        id: gameId,
        topic: examLevel.title ?? "Exam",
        timeStarted: new Date().toISOString(),
        questions,
      }}
    />
  );
};

export default Page;
