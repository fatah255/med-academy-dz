import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");
    if (!quizId) {
      return NextResponse.json(
        { error: "quizId is required" },
        { status: 400 }
      );
    }

    // Quiz basics (isUnite + modules)
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        isUnite: true,
        quizModules: {
          select: { id: true, title: true },
          orderBy: { createdAt: "asc" }, // optional: stable ordering
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // All cours for this quiz (with their module link)
    const cours = await prisma.cours.findMany({
      where: { quizId },
      select: { id: true, title: true, quizModuleId: true },
      orderBy: { createdAt: "asc" },
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

    // Build total question map
    const questionCountByCourse: Record<string, number> = {};
    for (const row of totalByCourse) {
      // row.coursId can be null in schema, but here it's filtered by where, so safe to assert
      const cid = (row.coursId ?? "") as string;
      if (cid) questionCountByCourse[cid] = row._count._all;
    }

    // Flat cours options (always provided)
    const coursOptions = cours.map((c) => ({
      id: c.id,
      title: c.title,
      questionCount: questionCountByCourse[c.id] ?? 0,
    }));

    // Build year index + global min/max
    const yearIndex: Record<string, Record<number, number>> = {};
    let minYear: number | null = null;
    let maxYear: number | null = null;

    for (const row of byCourseYear) {
      const coursId = (row.coursId ?? "") as string;
      const examYear = row.examYear as number | null;
      if (!coursId || examYear == null) continue;

      yearIndex[coursId] ??= {};
      yearIndex[coursId][examYear] = row._count._all;

      if (minYear === null || examYear < minYear) minYear = examYear;
      if (maxYear === null || examYear > maxYear) maxYear = examYear;
    }

    const totalQuestions = Object.values(questionCountByCourse).reduce(
      (a, b) => a + b,
      0
    );

    // If the quiz is a "unité", also provide moduleGroups
    let moduleGroups:
      | {
          id: string;
          title: string;
          cours: { id: string; title: string; questionCount?: number | null }[];
        }[]
      | undefined;

    if (quiz.isUnite) {
      // Seed groups from actual modules
      const groupMap = new Map<
        string,
        {
          id: string;
          title: string;
          cours: { id: string; title: string; questionCount?: number | null }[];
        }
      >();

      for (const m of quiz.quizModules) {
        groupMap.set(m.id, { id: m.id, title: m.title, cours: [] });
      }

      // Optional "Other" group for cours without a module
      let otherGroup: {
        id: string;
        title: string;
        cours: { id: string; title: string; questionCount?: number | null }[];
      } | null = null;

      for (const c of cours) {
        const entry = {
          id: c.id,
          title: c.title,
          questionCount: questionCountByCourse[c.id] ?? 0,
        };

        if (c.quizModuleId && groupMap.has(c.quizModuleId)) {
          groupMap.get(c.quizModuleId)!.cours.push(entry);
        } else {
          if (!otherGroup) {
            otherGroup = { id: "__ungrouped__", title: "Other", cours: [] };
          }
          otherGroup.cours.push(entry);
        }
      }

      moduleGroups = Array.from(groupMap.values());
      if (otherGroup && otherGroup.cours.length > 0) {
        moduleGroups.push(otherGroup);
      }

      // (Optional) remove empty modules if you don't want to show them:
      // moduleGroups = moduleGroups.filter(g => g.cours.length > 0);
    }

    return NextResponse.json({
      // existing fields the client already expects:
      coursOptions,
      yearIndex,
      globalMinYear: minYear,
      globalMaxYear: maxYear,
      totalQuestions,

      // new fields for module-first UI:
      isUnite: quiz.isUnite,
      ...(quiz.isUnite ? { moduleGroups } : {}),
    });
  } catch (err: any) {
    console.error("start-info error:", err);
    return NextResponse.json(
      { error: "Failed to load quiz start info" },
      { status: 500 }
    );
  }
}
