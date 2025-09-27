import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ClientQCM from "../_components/ClientQCM";
import { v4 as uuidv4 } from "uuid";
import { requireUser } from "@/app/data/user/require-user";

type PageProps = {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<{
    ques?: string;
    cours?: string;
    yearFrom?: string;
    yearTo?: string;
  }>;
};

// Simple in-place Fisher–Yates
function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { quizId } = await params;
  const sp = await searchParams;

  // URL filters
  const requestedCount = Number.parseInt(sp?.ques ?? "", 10);
  const requestedQues = Number.isFinite(requestedCount) ? requestedCount : 0;

  const selectedCoursIds = (sp?.cours ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Year range (optional)
  const yf = Number.parseInt(sp?.yearFrom ?? "", 10);
  const yt = Number.parseInt(sp?.yearTo ?? "", 10);
  const hasYF = Number.isFinite(yf);
  const hasYT = Number.isFinite(yt);

  // Build examYear where if both ends provided
  const examYearWhere = hasYF && hasYT ? { gte: yf, lte: yt } : undefined;

  // Auth
  const session = await requireUser();

  // Fetch only needed data, with optional course + year filtering
  const data = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      title: true,
      price: true,
      cours: {
        where: selectedCoursIds.length
          ? { id: { in: selectedCoursIds } }
          : undefined,
        select: {
          id: true,
          title: true,
          qcm: {
            where: {
              parentId: null,
              ...(examYearWhere ? { examYear: examYearWhere } : {}), // filter by range if set
            },
            orderBy: { examYear: "desc" }, // your preferred default order
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
                orderBy: [{ createdAt: "desc" }, { position: "asc" }],
                select: {
                  id: true,
                  question: true,
                  comment: true,
                  type: true,
                  typeQuestionId: true,
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

  // Optional paywall
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_quizId: { userId: session.user.id, quizId } },
  });
  if (!enrollment && data.price > 0) return notFound();

  // Flatten QCM from selected courses
  const allQcm = data.cours.flatMap((c) => c.qcm);

  if (allQcm.length === 0) return notFound();

  // Shuffle + server-side cap (defensive against tampered URL)
  // shuffleInPlace(allQcm);
  const limit =
    requestedQues > 0 ? Math.min(requestedQues, allQcm.length) : allQcm.length;
  const picked = allQcm.slice(0, limit);

  // Map for client component
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
