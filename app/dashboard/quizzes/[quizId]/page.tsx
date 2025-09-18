import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ClientQCM from "../_components/ClientQCM";
import { v4 as uuidv4 } from "uuid";
import { requireUser } from "@/app/data/user/require-user";

type PageProps = {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<{ ques?: string; cours?: string }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { quizId } = await params;
  const sp = await searchParams;

  // Parse filters from URL
  const requestedCount = Number.parseInt(sp?.ques ?? "", 10);
  const requestedQues = Number.isFinite(requestedCount) ? requestedCount : 0;

  const selectedCoursIds = (sp?.cours ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Auth (kept as in your code)
  const session = await requireUser();

  // Fetch the quiz and only the cours we care about (if any were specified)
  const data = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      title: true,
      price: true,
      cours: {
        where: selectedCoursIds.length
          ? { id: { in: selectedCoursIds } }
          : undefined, // if none selected, return all cours of this quiz
        select: {
          id: true,
          title: true,
          qcm: {
            orderBy: { createdAt: "asc", examYear: "asc" },
            where: { parentId: null },
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
                orderBy: { createdAt: "asc" },
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
          },
        },
      },
    },
  });

  if (!data) return notFound();

  // Optional paywall (you had this commented; kept intact)
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_quizId: {
        userId: session.user.id,
        quizId,
      },
    },
  });

  if (!enrollment && data.price > 0) return notFound();

  // Flatten all selected cours' QCM into one list
  const allQcm = data.cours.flatMap((c) => c.qcm);

  if (allQcm.length === 0) {
    // No QCM in selected cours (or none exist)
    return notFound();
  }

  // Shuffle to randomize
  const shuffled = [...allQcm].sort(() => Math.random() - 0.5);

  // If you want to cap by ?ques (when > 0), do it here. If you prefer to always send all,
  // set requestedQues to 0 in the URL, and we won't slice.
  const picked =
    requestedQues > 0
      ? shuffled.slice(0, Math.min(requestedQues, shuffled.length))
      : shuffled;

  // Map to the shape ClientQCM expects, including clinique sub-questions
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

  const gameId = uuidv4();

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
