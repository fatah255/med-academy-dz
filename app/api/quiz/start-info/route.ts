import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const quizId = searchParams.get("quizId");
  if (!quizId) {
    return NextResponse.json({ error: "quizId is required" }, { status: 400 });
  }

  // Basic course list for the quiz
  const cours = await prisma.cours.findMany({
    where: { quizId },
    select: { id: true, title: true },
  });

  // Count all questions per course (total)
  const totalByCourse = await prisma.qcm.groupBy({
    by: ["coursId"],
    where: { cours: { quizId } },
    _count: { _all: true },
  });

  // Count by (course, examYear) to build the year index (ignore nulls later)
  const byCourseYear = await prisma.qcm.groupBy({
    by: ["coursId", "examYear"],
    where: { cours: { quizId } },
    _count: { _all: true },
  });

  const questionCountByCourse: Record<string, number> = {};
  for (const row of totalByCourse) {
    questionCountByCourse[row.coursId!] = row._count._all;
  }

  const coursOptions = cours.map((c) => ({
    id: c.id,
    title: c.title,
    questionCount: questionCountByCourse[c.id] ?? 0,
  }));

  const yearIndex: Record<string, Record<number, number>> = {};
  let minYear: number | null = null;
  let maxYear: number | null = null;

  for (const row of byCourseYear) {
    const { coursId, examYear, _count } = row as {
      coursId: string;
      examYear: number | null;
      _count: { _all: number };
    };
    if (examYear == null) continue;
    yearIndex[coursId] ??= {};
    yearIndex[coursId][examYear] = _count._all;

    if (minYear === null || examYear < minYear) minYear = examYear;
    if (maxYear === null || examYear > maxYear) maxYear = examYear;
  }

  const totalQuestions = Object.values(questionCountByCourse).reduce(
    (a, b) => a + b,
    0
  );

  return NextResponse.json({
    coursOptions,
    yearIndex,
    globalMinYear: minYear,
    globalMaxYear: maxYear,
    totalQuestions,
  });
}
