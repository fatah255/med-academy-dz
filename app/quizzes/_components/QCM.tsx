"use client";

import React from "react";
import Link from "next/link";
import { differenceInSeconds } from "date-fns";
import { BarChart, ChevronRight, Timer, MessageSquare } from "lucide-react";
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

/* ---------- Types ---------- */
type AnswerLog = {
  questionId: string;
  question: string;
  options: string[];
  correctIndices: number[];
  selectedIndices: number[];
  isCorrect: boolean;
};

type GameStats = {
  id: string;
  topic: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  answers: AnswerLog[];
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
};

type UIQuestion = {
  id: string;
  question: string; // stem (for clinical this is the long case)
  options: string[]; // for normal questions
  correctIndices: number[]; // for normal questions
  comment?: string | null;

  // meta
  year?: number | null;
  type?: string | null; // e.g. "QCM", "Cas Clinique"
  typeId?: number | null;

  // clinical sub-questions (each with its own choices/answers)
  subQuestions?: UISubQuestion[];
};

export type UIGame = {
  id: string;
  topic: string;
  timeStarted: string | Date;
  questions: UIQuestion[];
};

type Props = { game: UIGame };

const STORAGE_KEY = (gameId: string) => `mcq:stats:${gameId}`;

const MCQ: React.FC<Props> = ({ game }) => {
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [subIndex, setSubIndex] = React.useState(0); // for clinical cases
  const [hasEnded, setHasEnded] = React.useState(false);

  const [stats, setStats] = React.useState({
    correct_answers: 0,
    wrong_answers: 0,
  });
  const [selectedChoices, setSelectedChoices] = React.useState<Set<number>>(
    () => new Set()
  );
  const [answersLog, setAnswersLog] = React.useState<AnswerLog[]>([]);
  const [verified, setVerified] = React.useState(false);

  // Bottom sheet for comments
  const [commentOpen, setCommentOpen] = React.useState(false);

  const [now, setNow] = React.useState(new Date());
  const startedAt = React.useMemo(
    () => new Date(game.timeStarted),
    [game.timeStarted]
  );

  const currentQuestion = React.useMemo(
    () => game.questions[questionIndex],
    [game.questions, questionIndex]
  );

  const hasSubs = (currentQuestion?.subQuestions?.length ?? 0) > 0;
  const isClinical = (currentQuestion?.typeId ?? 0) >= 5 && hasSubs;

  const active = React.useMemo<UISubQuestion | UIQuestion>(() => {
    return isClinical
      ? currentQuestion.subQuestions![subIndex]
      : currentQuestion;
  }, [isClinical, currentQuestion, subIndex]);

  // keep the timer ticking while quiz is not ended
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!hasEnded) setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [hasEnded]);

  // reset per-question state when moving to a new main question
  React.useEffect(() => {
    setSubIndex(0);
    setSelectedChoices(new Set());
    setVerified(false);
    setCommentOpen(false);
  }, [questionIndex]);

  // also reset selection when switching sub-questions
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

  const persistStats = React.useCallback(
    (finalAnswers: AnswerLog[], correct: number, wrong: number) => {
      const endedAt = new Date();
      const payload: GameStats = {
        id: game.id,
        topic: game.topic,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationSeconds: differenceInSeconds(endedAt, startedAt),
        totalQuestions: game.questions.length,
        correctCount: correct,
        wrongCount: wrong,
        answers: finalAnswers,
      };
      try {
        localStorage.setItem(STORAGE_KEY(game.id), JSON.stringify(payload));
      } catch {}
    },
    [game.id, game.topic, game.questions.length, startedAt]
  );

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

    // if last main question and not clinical OR (clinical and last sub + last main) => end
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
      persistStats(finalLog, finalCorrect, finalWrong);
      setHasEnded(true);
      return;
    }

    setVerified(true);
  }, [
    active,
    selectedChoices,
    questionIndex,
    game.questions.length,
    subIndex,
    isClinical,
    currentQuestion.subQuestions,
    stats.correct_answers,
    stats.wrong_answers,
    answersLog,
    persistStats,
  ]);

  const handleNext = React.useCallback(() => {
    if (isClinical) {
      const lastSub =
        subIndex === (currentQuestion.subQuestions?.length ?? 1) - 1;
      if (!lastSub) {
        setSubIndex((i) => i + 1);
        return;
      }
    }

    // move to next main question (or finish if last)
    const lastMain = questionIndex === game.questions.length - 1;
    if (lastMain) {
      persistStats(answersLog, stats.correct_answers, stats.wrong_answers);
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
    persistStats,
    answersLog,
    stats.correct_answers,
    stats.wrong_answers,
  ]);

  // keyboard shortcuts use the active item's options
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

  // Sanitize comment for the ACTIVE item (sub-question for clinical, otherwise parent)
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

  if (hasEnded) {
    return (
      <div className="mx-auto w-[90vw] max-w-4xl py-10">
        <div className="px-4 py-2 font-semibold text-white bg-green-500 rounded-md inline-block">
          You Completed in{" "}
          {formatTimeDelta(differenceInSeconds(now, startedAt))}
        </div>
        <div className="mt-3">
          <Link
            href={`/dashboard/quizzes/${game.topic}/statistics/${game.id}`}
            className={cn(buttonVariants({ size: "lg" }))}
          >
            View Statistics
            <BarChart className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  const correctSet = new Set(active?.correctIndices ?? []);
  const showStemScroller = (currentQuestion?.typeId ?? 0) >= 5; // clinical

  return (
    <div className="mx-auto w-[90vw] max-w-4xl min-h-[calc(100vh-6rem)] py-6 md:py-10">
      {/* Header */}
      <div className="flex flex-row justify-between gap-4">
        <div className="flex flex-col">
          <p>
            <span className="text-slate-400">Topic</span>&nbsp;
            <span className="px-2 py-1 text-white rounded-lg bg-slate-800">
              {game.topic}
            </span>
          </p>
          <div className="flex items-center mt-3 gap-2 text-slate-400">
            <span className="inline-flex items-center">
              <Timer className="mr-2" />
              {formatTimeDelta(differenceInSeconds(now, startedAt))}
            </span>
            {currentQuestion?.year ? (
              <span className="rounded border border-slate-700/60 bg-slate-800/40 text-xs px-2 py-0.5">
                {currentQuestion.year}
              </span>
            ) : null}
            {currentQuestion?.type ? (
              <span className="rounded border border-slate-700/60 bg-slate-800/40 text-xs px-2 py-0.5">
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

      {/* Main question / clinical stem */}
      <Card className="w-full mt-4">
        <CardHeader className="flex flex-row items-start gap-4">
          <CardTitle className="mr-2 text-center divide-y divide-zinc-600/50 shrink-0">
            <div>{questionIndex + 1}</div>
            <div className="text-base text-slate-400">
              {game.questions.length}
            </div>
          </CardTitle>

          <div
            className={cn(
              "flex flex-col flex-grow",
              showStemScroller ? "max-h-[45vh] overflow-auto pr-1" : ""
            )}
          >
            <CardDescription className="text-base md:text-lg whitespace-pre-wrap break-words">
              {currentQuestion?.question}
            </CardDescription>

            {/* If clinical, show which sub we're on */}
            {isClinical && (
              <span className="mt-2 text-xs text-slate-400">
                Sub-question {subIndex + 1}/
                {currentQuestion.subQuestions!.length}
              </span>
            )}
            {!isClinical && (
              <span className="mt-1 text-xs text-slate-400">
                Select all that apply
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Sub-question prompt (for clinical) */}
      {isClinical && active?.question && (
        <Card className="w-full mt-3">
          <CardHeader>
            <CardDescription className="text-base md:text-lg whitespace-pre-wrap break-words">
              {active.question}
            </CardDescription>
            <span className="mt-1 text-xs text-slate-400">
              Select all that apply
            </span>
          </CardHeader>
        </Card>
      )}

      {/* Options for the active item (sub-question if clinical, else the main question) */}
      <div className="flex flex-col items-center justify-center w-full mt-4">
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
              className={cn("justify-start w-full py-8 mb-4", revealedClass)}
              onClick={() => toggleChoice(index)}
              disabled={verified}
            >
              <div className="flex items-center justify-start">
                <div className="p-2 px-3 mr-5 border rounded-md">
                  {numToLetter.get(index + 1)}
                </div>
                <div className="text-start break-words">{option}</div>
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
            disabled={verified}
          >
            Clear
          </Button>
          <Button
            className="mt-2"
            size="lg"
            disabled={
              (active?.options?.length ?? 0) === 0 ||
              selectedChoices.size === 0 ||
              verified
            }
            onClick={handleVerify}
          >
            Verify
          </Button>
          <Button className="mt-2" size="lg" onClick={handleNext}>
            {verified ? "Next" : "Skip"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
          {/* Show comment button only after verification and when it exists */}
          {verified && !!safeCommentHtml && (
            <Button
              variant="outline"
              className="mt-2"
              size="lg"
              onClick={() => setCommentOpen(true)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Show comment
            </Button>
          )}{" "}
          {currentQuestion.typeId === 2 && (
            <Button
              variant="outline"
              className="mt-2"
              size="lg"
              onClick={() => setCommentOpen(true)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Show comment
            </Button>
          )}
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
              <div className="rounded-t-lg border bg-background shadow-xl max-h-[55vh] overflow-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b">
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
                    className="prose prose-invert max-w-none mcq-comment"
                    dangerouslySetInnerHTML={{ __html: safeCommentHtml }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Responsive media inside comments */}
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
