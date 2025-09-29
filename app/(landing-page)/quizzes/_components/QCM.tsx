"use client";

import React from "react";
import Link from "next/link";
import { differenceInSeconds } from "date-fns";
import {
  BarChart,
  ChevronRight,
  Timer,
  MessageSquare,
  Check,
  X,
  Flag,
  Loader2,
  Award,
  History,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertIcon, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn, formatTimeDelta, numToLetter } from "@/lib/utils";
import MCQCounter from "./MCQCounter";
import { toast } from "sonner";
import { RiCheckboxCircleFill, RiErrorWarningFill } from "@remixicon/react";
import DOMPurify from "isomorphic-dompurify";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSession } from "@/lib/auth-client";

/* =========================
   Types
   ========================= */
type AnswerLog = {
  questionId: string;
  question: string;
  options: string[];
  correctIndices: number[];
  selectedIndices: number[];
  isCorrect: boolean;
};

type UISubQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndices: number[];
  comment?: string | null;
  year?: number | null;
  type?: string | null;
  typeId?: number | null;
  cours?: String | null;
};

type UIQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndices: number[];
  comment?: string | null;
  cours?: String | null;
  year?: number | null;
  type?: string | null;
  typeId?: number | null;

  subQuestions?: UISubQuestion[];
};

export type UIGame = {
  id?: string;
  quizId?: string | null;
  coursId?: string | null;
  examId?: string | null;
  topic: string;
  timeStarted: string | Date;
  questions: UIQuestion[];
};

type Props = { game: UIGame };

type QStatus = "idle" | "correct" | "wrong";

const STORAGE_KEY = (k: string) => `mcq:stats:${k}`;

async function postAttempt(body: any) {
  await fetch("/api/quiz/end", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* =================================================================== */

const MCQ: React.FC<Props> = ({ game }) => {
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [subIndex, setSubIndex] = React.useState(0);
  const [hasEnded, setHasEnded] = React.useState(false);
  const session = useSession();

  const [stats, setStats] = React.useState({
    correct_answers: 0,
    wrong_answers: 0,
  });
  const [selectedChoices, setSelectedChoices] = React.useState<Set<number>>(
    () => new Set()
  );
  const [answersLog, setAnswersLog] = React.useState<AnswerLog[]>([]);
  const [verified, setVerified] = React.useState(false);

  const [commentOpen, setCommentOpen] = React.useState(false);

  const [now, setNow] = React.useState(new Date());
  const [endedAt, setEndedAt] = React.useState<Date | null>(null);

  const startedAt = React.useMemo(
    () => new Date(game.timeStarted),
    [game.timeStarted]
  );

  const storageKey = React.useMemo(
    () => game.id ?? `${game.topic}:${startedAt.toISOString()}`,
    [game.id, game.topic, startedAt]
  );

  const currentQuestion = React.useMemo(
    () => game.questions[questionIndex],
    [game.questions, questionIndex]
  );

  const hasSubs = (currentQuestion?.subQuestions?.length ?? 0) > 0;
  const isClinical = (currentQuestion?.typeId ?? 0) >= 5 && hasSubs;

  const active = React.useMemo<UISubQuestion | UIQuestion>(
    () =>
      isClinical ? currentQuestion.subQuestions![subIndex] : currentQuestion,
    [isClinical, currentQuestion, subIndex]
  );

  /* -------- Timer -------- */
  React.useEffect(() => {
    const id = setInterval(() => {
      if (!hasEnded) setNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, [hasEnded]);

  /* -------- Reset when navigating (safety) -------- */
  React.useEffect(() => {
    setSubIndex(0);
    setSelectedChoices(new Set());
    setVerified(false);
    setCommentOpen(false);
  }, [questionIndex]);

  React.useEffect(() => {
    setSelectedChoices(new Set());
    setVerified(false);
    setCommentOpen(false);
  }, [subIndex]);

  const toggleChoice = React.useCallback(
    (idx: number) => {
      if (verified) return;
      setSelectedChoices((prev) => {
        const next = new Set(prev);
        next.has(idx) ? next.delete(idx) : next.add(idx);
        return next;
      });
    },
    [verified]
  );

  const setsEqual = (a: Set<number>, b: Set<number>) =>
    a.size === b.size && [...a].every((v) => b.has(v));

  /* -------- Navigator status + clinical tracking -------- */
  const [qStatus, setQStatus] = React.useState<QStatus[]>(() =>
    Array(game.questions.length).fill("idle")
  );
  const [clinicalProgress, setClinicalProgress] = React.useState<
    Record<number, { total: number; answered: number; wrong: boolean }>
  >({});

  /* -------- Local snapshot (optional) -------- */
  const persistLocal = React.useCallback(
    (finalAnswers: AnswerLog[], correct: number, wrong: number) => {
      const ended = new Date();
      const payload = {
        topic: game.topic,
        startedAt: startedAt.toISOString(),
        endedAt: ended.toISOString(),
        durationSeconds: differenceInSeconds(ended, startedAt),
        totalQuestions: game.questions.length,
        correctCount: correct,
        wrongCount: wrong,
        answers: finalAnswers,
      };
      try {
        localStorage.setItem(STORAGE_KEY(storageKey), JSON.stringify(payload));
      } catch {}
    },
    [game.topic, game.questions.length, startedAt, storageKey]
  );

  /* -------- All qcm ids for storage -------- */
  const allQcmIds = React.useMemo(
    () =>
      game.questions.flatMap((q) =>
        q.subQuestions && q.subQuestions.length > 0
          ? q.subQuestions.map((s) => s.id)
          : [q.id]
      ),
    [game.questions]
  );

  /* -------- Remote save helper (NO gameId) -------- */
  const saveRemoteAttempt = React.useCallback(
    async ({
      attemptedOverride,
      completedAll,
    }: {
      attemptedOverride?: number;
      completedAll: boolean;
    }) => {
      const ended = new Date();
      const attempted = attemptedOverride ?? answersLog.length;
      const scorePercent = Math.round(
        (stats.correct_answers * 100) / Math.max(1, attempted)
      );

      await postAttempt({
        userId: session.data?.user.id,
        quizId: game.quizId ?? null,
        coursId: game.coursId ?? null,
        examId: game.examId ?? null,

        topic: game.topic,
        startedAtISO: startedAt.toISOString(),
        endedAtISO: ended.toISOString(),
        durationSeconds: differenceInSeconds(ended, startedAt),

        totalQuestions: game.questions.length,
        attempted,
        correctCount: stats.correct_answers,
        wrongCount: stats.wrong_answers,
        scorePercent,
        completedAll,

        qcmIds: allQcmIds,
        answers: answersLog,
      });
    },
    [
      answersLog,
      stats.correct_answers,
      stats.wrong_answers,
      game.quizId,
      game.coursId,
      game.examId,
      game.topic,
      game.questions.length,
      startedAt,
      allQcmIds,
      session.data?.user.id,
    ]
  );

  /* -------- Verify -------- */
  const handleVerify = React.useCallback(() => {
    if (!active || selectedChoices.size === 0) return;

    const correctSet = new Set(active.correctIndices ?? []);
    const isCorrect = setsEqual(selectedChoices, correctSet);

    const entry: AnswerLog = {
      questionId: active.id,
      question: active.question,
      options: active.options ?? [],
      correctIndices: active.correctIndices ?? [],
      selectedIndices: [...selectedChoices].sort((a, b) => a - b),
      isCorrect,
    };

    setAnswersLog((prev) => [...prev, entry]);

    if (isCorrect) {
      setStats((s) => ({ ...s, correct_answers: s.correct_answers + 1 }));
      toast.custom((t) => (
        <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
          <AlertIcon>
            <RiCheckboxCircleFill />
          </AlertIcon>
          <AlertTitle>Correct</AlertTitle>
        </Alert>
      ));
    } else {
      setStats((s) => ({ ...s, wrong_answers: s.wrong_answers + 1 }));
      toast.custom((t) => (
        <Alert
          variant="mono"
          icon="destructive"
          onClose={() => toast.dismiss(t)}
        >
          <AlertIcon>
            <RiErrorWarningFill />
          </AlertIcon>
          <AlertTitle>Wrong</AlertTitle>
        </Alert>
      ));
    }

    // Update navigator status
    if (!isClinical) {
      setQStatus((prev) => {
        const next = [...prev];
        next[questionIndex] = isCorrect ? "correct" : "wrong";
        return next;
      });
    } else {
      const totalSubs = currentQuestion.subQuestions?.length ?? 1;
      setClinicalProgress((prev) => {
        const p = prev[questionIndex] ?? {
          total: totalSubs,
          answered: 0,
          wrong: false,
        };
        const answered = p.answered + 1;
        const wrong = p.wrong || !isCorrect;
        const out = { total: totalSubs, answered, wrong };

        setQStatus((prevStatus) => {
          const s = [...prevStatus];
          if (wrong) s[questionIndex] = "wrong";
          else if (answered === totalSubs) s[questionIndex] = "correct";
          return s;
        });

        return { ...prev, [questionIndex]: out };
      });
    }

    // End?
    const lastMain = questionIndex === game.questions.length - 1;
    const lastSub =
      !isClinical ||
      subIndex === (currentQuestion.subQuestions?.length ?? 1) - 1;

    if (lastMain && lastSub) {
      const finalCorrect = isCorrect
        ? stats.correct_answers + 1
        : stats.correct_answers;
      const finalWrong = !isCorrect
        ? stats.wrong_answers + 1
        : stats.wrong_answers;
      const finalLog = [...answersLog, entry];

      persistLocal(finalLog, finalCorrect, finalWrong);
      void saveRemoteAttempt({ completedAll: true });
      setEndedAt(new Date());
      setHasEnded(true);
      return;
    }

    setVerified(true);
  }, [
    active,
    selectedChoices,
    isClinical,
    questionIndex,
    game.questions.length,
    subIndex,
    currentQuestion.subQuestions,
    stats.correct_answers,
    stats.wrong_answers,
    answersLog,
    persistLocal,
    saveRemoteAttempt,
  ]);

  /* -------- Next / Skip -------- */
  const handleNext = React.useCallback(() => {
    // FIX: reset reveal state BEFORE navigating to prevent brief flash
    setVerified(false);
    setSelectedChoices(new Set());
    setCommentOpen(false);

    if (isClinical) {
      const lastSub =
        subIndex === (currentQuestion.subQuestions?.length ?? 1) - 1;
      if (!lastSub) {
        setSubIndex((i) => i + 1);
        return;
      }
    }

    const lastMain = questionIndex === game.questions.length - 1;
    if (lastMain) {
      persistLocal(answersLog, stats.correct_answers, stats.wrong_answers);
      void saveRemoteAttempt({ completedAll: true });
      setEndedAt(new Date());
      setHasEnded(true);
      return;
    }

    setQuestionIndex((i) => i + 1);
  }, [
    isClinical,
    subIndex,
    currentQuestion.subQuestions,
    questionIndex,
    game.questions.length,
    persistLocal,
    answersLog,
    stats.correct_answers,
    stats.wrong_answers,
    saveRemoteAttempt,
  ]);

  /* -------- Keyboard shortcuts -------- */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!active) return;
      const num = Number(e.key);
      if (
        Number.isInteger(num) &&
        num >= 1 &&
        num <= (active.options?.length ?? 0)
      ) {
        toggleChoice(num - 1);
      } else if (e.key === "Enter") {
        if (!verified) handleVerify();
        else handleNext();
      } else if (e.key.toLowerCase() === "c") {
        if (!verified) setSelectedChoices(new Set());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, toggleChoice, handleVerify, handleNext, verified]);

  /* -------- Sanitize comment HTML -------- */
  const safeCommentHtml = React.useMemo(() => {
    const raw = active?.comment ?? "";
    if (!raw) return "";
    let html = raw;
    try {
      const doc = new DOMParser().parseFromString(raw, "text/html");
      const body = doc?.body?.innerHTML;
      if (body) html = body;
    } catch {}
    return DOMPurify.sanitize(html, { ADD_ATTR: ["style"] });
  }, [active?.comment]);

  /* -------- Mobile navigator padding fix -------- */
  const [mobileNavHeight, setMobileNavHeight] = React.useState(0);

  /* -------- Jump helper -------- */
  const jumpTo = React.useCallback(
    (i: number) => {
      if (i < 0 || i >= game.questions.length) return;
      // FIX: reset immediately when jumping to avoid flash
      setVerified(false);
      setSelectedChoices(new Set());
      setCommentOpen(false);
      setSubIndex(0);
      setQuestionIndex(i);
      if (typeof window !== "undefined")
        window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [game.questions.length]
  );

  /* -------- End Game now (confirmation + loading) -------- */
  const [endOpen, setEndOpen] = React.useState(false);
  const [ending, setEnding] = React.useState(false);

  const endGameNowConfirmed = React.useCallback(async () => {
    try {
      setEnding(true);
      // local + remote with partial
      persistLocal(answersLog, stats.correct_answers, stats.wrong_answers);
      await saveRemoteAttempt({
        completedAll: false,
        attemptedOverride: answersLog.length,
      });
      setEndedAt(new Date());
      setHasEnded(true);
    } finally {
      setEnding(false);
      setEndOpen(false);
    }
  }, [
    answersLog,
    stats.correct_answers,
    stats.wrong_answers,
    persistLocal,
    saveRemoteAttempt,
  ]);

  /* -------- Completed view (polished layout) -------- */
  if (hasEnded) {
    const finishedAt = endedAt ?? now;
    const duration = formatTimeDelta(
      differenceInSeconds(finishedAt, startedAt)
    );
    const attempted = answersLog.length || 0;
    const correct = stats.correct_answers;
    const wrong = stats.wrong_answers;
    const scorePercent = Math.round((correct * 100) / Math.max(1, attempted));

    return (
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-[92vw] max-w-2xl flex-col items-center justify-center gap-6 py-8">
        <div className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow">
          <Timer className="h-4 w-4" />
          Completed in {duration}
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Well done!</CardTitle>
                <CardDescription>
                  Here’s how you performed on <b>{game.topic}</b>
                </CardDescription>
              </div>
              <div className="rounded-full border bg-muted/40 p-3">
                <Award className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Attempted</div>
                <div className="text-lg font-semibold">{attempted}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Correct</div>
                <div className="text-lg font-semibold text-emerald-500">
                  {correct}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Wrong</div>
                <div className="text-lg font-semibold text-rose-500">
                  {wrong}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Score</span>
                <span className="font-medium">{scorePercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full border">
                <div
                  className="h-full bg-emerald-500 transition-[width]"
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={`/dashboard/quizzes/${game.topic}/statistics/${
                  game.id ?? "latest"
                }`}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                View Statistics <BarChart className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href={`/dashboard/attempts`}
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" })
                )}
              >
                <History className="mr-2 h-4 w-4" /> View Your History
              </Link>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const correctSet = new Set(active?.correctIndices ?? []);
  const showStemScroller = (currentQuestion?.typeId ?? 0) >= 5;

  return (
    <div
      className="relative mx-auto w-[90vw] max-w-4xl min-h-[calc(100vh-6rem)] py-6 md:py-10"
      style={{
        paddingBottom: mobileNavHeight ? mobileNavHeight + 8 : undefined,
      }}
    >
      {/* Navigator */}
      <QuestionNavigator
        total={game.questions.length}
        current={questionIndex}
        status={qStatus}
        onJump={jumpTo}
        onMobileHeightChange={setMobileNavHeight}
      />

      {/* Header */}
      <div className="flex flex-row justify-between gap-4">
        <div className="flex flex-col">
          <p>
            <span className="text-slate-400">Topic</span>&nbsp;
            <span className="rounded-lg bg-slate-800 px-2 py-1 text-white">
              {game.topic}
            </span>
          </p>
          <div className="mt-3 flex items-center gap-2 text-slate-400">
            <span className="inline-flex items-center">
              <Timer className="mr-2" />
              {formatTimeDelta(differenceInSeconds(now, startedAt))}
            </span>
            {currentQuestion?.year ? (
              <span className="rounded border border-slate-700/60 bg-slate-800/40 px-2 py-0.5 text-xs">
                {currentQuestion.year}
              </span>
            ) : null}
            {currentQuestion?.cours ? (
              <span className="rounded border border-slate-700/60 bg-slate-800/40 px-2 py-0.5 text-xs">
                {currentQuestion.cours}
              </span>
            ) : null}
            {currentQuestion?.type ? (
              <span className="rounded border border-slate-700/60 bg-slate-800/40 px-2 py-0.5 text-xs">
                {currentQuestion.type}
              </span>
            ) : null}
          </div>
        </div>

        <MCQCounter
          correct_answers={stats.correct_answers}
          wrong_answers={stats.wrong_answers}
        />
      </div>

      {/* Main question / stem */}
      <Card className="mt-4 w-full">
        <CardHeader className="flex flex-row items-start gap-4">
          <CardTitle className="mr-2 shrink-0 divide-y divide-zinc-600/50 text-center">
            <div>{questionIndex + 1}</div>
            <div className="text-base text-slate-400">
              {game.questions.length}
            </div>
          </CardTitle>

          <div
            className={cn(
              "flex w-full flex-col",
              showStemScroller ? "max-h-[45vh] overflow-auto pr-1" : ""
            )}
          >
            <CardDescription className="whitespace-pre-wrap break-words text-base md:text-lg">
              {currentQuestion?.question}
            </CardDescription>

            {isClinical ? (
              <span className="mt-2 text-xs text-slate-400">
                Sub-question {subIndex + 1}/
                {currentQuestion.subQuestions!.length}
              </span>
            ) : (
              <span className="mt-1 text-xs text-slate-400">
                Select all that apply
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Clinical sub prompt */}
      {isClinical && active?.question && (
        <Card className="mt-3 w-full">
          <CardHeader>
            <CardDescription className="whitespace-pre-wrap break-words text-base md:text-lg">
              {active.question}
            </CardDescription>
            <span className="mt-1 text-xs text-slate-400">
              Select all that apply
            </span>
          </CardHeader>
        </Card>
      )}

      {/* Options */}
      <div className="mt-4 flex w-full flex-col items-center justify-center">
        {active?.options?.map((option, index) => {
          const isSelected = selectedChoices.has(index);
          const revealedClass = verified
            ? correctSet.has(index)
              ? "border-green-500 bg-green-500/10 text-green-400"
              : isSelected
              ? "border-red-500 bg-red-500/10 text-red-400"
              : "opacity-70"
            : "";

          return (
            <Button
              key={`${active.id}-${index}`}
              variant={isSelected && !verified ? undefined : "outline"}
              className={cn(
                "mb-4 w-full justify-start py-6 text-left",
                revealedClass
              )}
              onClick={() => toggleChoice(index)}
              disabled={verified || ending}
            >
              {/* make the row take full width */}
              <div className="flex w-full items-start gap-3">
                <div className="shrink-0 rounded-md border px-3 py-2">
                  {numToLetter.get(index + 1)}
                </div>

                {/* allow wrapping */}
                <div className="flex-1 min-w-0 whitespace-pre-wrap break-words leading-relaxed">
                  {option}
                </div>
              </div>
            </Button>
          );
        })}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="mt-2"
            size="lg"
            onClick={() => setSelectedChoices(new Set())}
            disabled={verified || ending}
          >
            Clear
          </Button>
          <Button
            className="mt-2"
            size="lg"
            disabled={
              ending ||
              (active?.options?.length ?? 0) === 0 ||
              selectedChoices.size === 0 ||
              verified
            }
            onClick={handleVerify}
          >
            Verify
          </Button>
          <Button
            className="mt-2"
            size="lg"
            onClick={handleNext}
            disabled={ending}
          >
            {verified ? "Next" : "Skip"}{" "}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>

          {/* >>> Show / Hide Comment button <<< */}
          {safeCommentHtml && verified && (
            <Button
              variant="outline"
              className="mt-2"
              size="lg"
              onClick={() => setCommentOpen((o) => !o)}
              aria-expanded={commentOpen}
              title={commentOpen ? "Hide comment" : "Show comment"}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {commentOpen ? "Hide comment" : "Show comment"}
            </Button>
          )}

          {/* End Game now (save partial) - with confirmation */}
          <AlertDialog open={endOpen} onOpenChange={setEndOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="mt-2"
                size="lg"
                title="Finish now and save current progress"
                disabled={ending}
              >
                {ending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ending…
                  </>
                ) : (
                  <>
                    <Flag className="mr-2 h-4 w-4" />
                    End Game
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End the game now?</AlertDialogTitle>
                <AlertDialogDescription>
                  We’ll save your current progress ({answersLog.length}{" "}
                  answered). You can review results on the next screen. This
                  action can’t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={ending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={endGameNowConfirmed}
                  disabled={ending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {ending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ending…
                    </span>
                  ) : (
                    "Yes, end now"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Bottom-sheet comment */}
      {commentOpen && safeCommentHtml && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setCommentOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50">
            <div className="mx-auto w-full max-w-4xl px-4 pb-4">
              <div className="max-h-[55vh] overflow-auto rounded-t-lg border bg-background shadow-xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <p className="text-sm font-medium">Comment</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCommentOpen(false)}
                  >
                    Hide comment
                  </Button>
                </div>
                <div className="p-4">
                  <div
                    className="mcq-comment prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: safeCommentHtml }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Media inside comments */}
      <style jsx>{`
        .mcq-comment img,
        .mcq-comment video,
        .mcq-comment canvas,
        .mcq-comment iframe {
          max-width: 100%;
          height: auto;
          display: block;
        }
        .mcq-comment table {
          width: 100%;
          border-collapse: collapse;
        }
        .mcq-comment * {
          max-width: 100%;
        }
      `}</style>
    </div>
  );
};

export default MCQ;

/* =========================
   Question Navigator
   ========================= */
function QuestionNavigator({
  total,
  current,
  status,
  onJump,
  onMobileHeightChange,
}: {
  total: number;
  current: number;
  status: QStatus[];
  onJump: (index: number) => void;
  onMobileHeightChange?: (h: number) => void;
}) {
  const Tile = ({
    i,
    s,
    active,
  }: {
    i: number;
    s: QStatus;
    active: boolean;
  }) => {
    const base =
      "relative inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-medium transition";
    const activeRing = active ? "ring-2 ring-primary" : "";
    const palette =
      s === "correct"
        ? "border-green-500/40 bg-green-500/10 text-green-400"
        : s === "wrong"
        ? "border-red-500/40 bg-red-500/10 text-red-400"
        : "border-slate-700/60 bg-slate-800/40 text-slate-300 hover:bg-slate-800/60";
    return (
      <button
        key={i}
        className={cn(base, activeRing, palette)}
        onClick={() => onJump(i)}
        aria-current={active ? "true" : "false"}
        title={`Go to Q${i + 1}`}
      >
        <span className="mr-1">Q{i + 1}</span>
        {s === "correct" ? (
          <Check className="h-3.5 w-3.5" />
        ) : s === "wrong" ? (
          <X className="h-3.5 w-3.5" />
        ) : null}
      </button>
    );
  };

  // Mobile bar height reporting (safe-area aware)
  const mobileRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = mobileRef.current;
    if (!el || !onMobileHeightChange) return;
    const measure = () =>
      onMobileHeightChange(Math.ceil(el.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [onMobileHeightChange]);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="pointer-events-auto fixed right-4 top-28 z-30 hidden max-h-[70vh] w-[120px] overflow-auto rounded-2xl border bg-background/80 p-2 backdrop-blur md:block">
        <div className="grid grid-cols-1 gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <Tile
              key={i}
              i={i}
              s={status[i] || "idle"}
              active={i === current}
            />
          ))}
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div
        ref={mobileRef}
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-2 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex w-full snap-x items-center gap-2 overflow-x-auto">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="snap-start">
              <Tile i={i} s={status[i] || "idle"} active={i === current} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
