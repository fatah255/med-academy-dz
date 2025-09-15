// app/dashboard/sessions/actions.ts
"use server";

import { prisma } from "@/lib/db";
import { nanoid } from "nanoid"; // add dependency or roll your own

type CreateSessionInput = {
  mode: "QUIZ" | "EXAM";
  quizId?: string;
  examId?: string;
  durationSec: number; // e.g., 1800 = 30min
  scheduledStart?: string | null; // ISO
  allowLateJoin?: boolean;
  hostId: string;
  // supply the selected questions in exact order (ids + optional minimal text)
  questionSnapshot: any;
};

export async function createLiveSession(input: CreateSessionInput) {
  const code = nanoid(8);
  const session = await prisma.liveSession.create({
    data: {
      mode: input.mode as any,
      quizId: input.quizId ?? null,
      examId: input.examId ?? null,
      hostId: input.hostId,
      durationSec: input.durationSec,
      scheduledStart: input.scheduledStart
        ? new Date(input.scheduledStart)
        : null,
      allowLateJoin: !!input.allowLateJoin,
      code,
      status: "LOBBY",
      questionSnapshot: input.questionSnapshot,
    },
  });
  return {
    id: session.id,
    joinUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sessions/${session.id}?code=${code}`,
  };
}
