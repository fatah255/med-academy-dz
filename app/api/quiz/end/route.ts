// File: app/api/quiz/end/route.ts
import {
  SaveAttemptInput,
  saveQuizAttempt,
} from "@/app/(landing-page)/quizzes/actions";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SaveAttemptInput;
    const out = await saveQuizAttempt(body);
    return NextResponse.json({ ok: true, id: out.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}
