// File: app/actions/quiz.ts
"use server";

import { prisma } from "@/lib/db";

export type SaveAttemptInput = {
  // optional owner
  userId?: string | null;

  // optional links to your existing content
  quizId?: string | null;
  coursId?: string | null;
  examId?: string | null;

  // label
  topic: string;

  // timing
  startedAtISO: string;
  endedAtISO: string;
  durationSeconds: number;

  // scoring
  totalQuestions: number;
  attempted: number;
  correctCount: number;
  wrongCount: number;
  scorePercent: number;
  completedAll: boolean;

  // bookkeeping
  qcmIds: string[];
  answers?: unknown; // e.g. AnswerLog[]
};

export async function saveQuizAttempt(input: SaveAttemptInput) {
  const rec = await prisma.quizAttempt.create({
    data: {
      userId: input.userId ?? undefined,

      quizId: input.quizId ?? undefined,
      coursId: input.coursId ?? undefined,
      examId: input.examId ?? undefined,

      topic: input.topic,

      startedAt: new Date(input.startedAtISO),
      endedAt: new Date(input.endedAtISO),
      durationSeconds: input.durationSeconds,

      totalQuestions: input.totalQuestions,
      attempted: input.attempted,
      correctCount: input.correctCount,
      wrongCount: input.wrongCount,
      scorePercent: input.scorePercent,
      completedAll: input.completedAll,

      qcmIds: input.qcmIds,
      answers: input.answers as any,
    },
  });

  return { id: rec.id };
}
