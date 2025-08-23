"use client";

import React from "react";
import Link from "next/link";
import { differenceInSeconds } from "date-fns";
import { BarChart, ChevronRight, Timer } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertIcon, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn, formatTimeDelta } from "@/lib/utils";
import MCQCounter from "./MCQCounter";
import { toast } from "sonner";
import { numToLetter } from "@/app/admin/quizzes/[quizId]/edit/_components/QuizStructure";
import { RiCheckboxCircleFill, RiErrorWarningFill } from "@remixicon/react";

/** ---------- Types for persisted stats ---------- */
type AnswerLog = {
  questionId: string;
  question: string;
  options: string[];
  correctIndices: number[];
  selectedIndices: number[];
  isCorrect: boolean;
};

type GameStats = {
  id: string; // game id
  topic: string;
  startedAt: string; // ISO
  endedAt: string; // ISO
  durationSeconds: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  answers: AnswerLog[];
};

type UIQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndices: number[];
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
  const [hasEnded, setHasEnded] = React.useState(false);
  const [stats, setStats] = React.useState({
    correct_answers: 0,
    wrong_answers: 0,
  });
  const [selectedChoices, setSelectedChoices] = React.useState<Set<number>>(
    () => new Set()
  );
  const [answersLog, setAnswersLog] = React.useState<AnswerLog[]>([]);
  const [now, setNow] = React.useState(new Date());

  const startedAt = React.useMemo(
    () => new Date(game.timeStarted),
    [game.timeStarted]
  );
  const currentQuestion = React.useMemo(
    () => game.questions[questionIndex],
    [game.questions, questionIndex]
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!hasEnded) setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [hasEnded]);

  const toggleChoice = React.useCallback((idx: number) => {
    setSelectedChoices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

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
      } catch {
        // if quota exceeded, at least avoid crashing the UI
        console.warn("Failed to save MCQ stats to localStorage.");
      }
    },
    [game.id, game.topic, game.questions.length, startedAt]
  );

  const handleNext = React.useCallback(() => {
    if (!currentQuestion) return;
    if (selectedChoices.size === 0) return;

    const correctSet = new Set(currentQuestion.correctIndices);
    const isCorrect = setsEqual(selectedChoices, correctSet);

    // Build the per-question log entry
    const entry: AnswerLog = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      options: currentQuestion.options,
      correctIndices: currentQuestion.correctIndices,
      selectedIndices: [...selectedChoices].sort((a, b) => a - b),
      isCorrect,
    };

    const nextLog = [...answersLog, entry];

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

    const last = questionIndex === game.questions.length - 1;
    if (last) {
      // persist before ending so log is complete
      const finalCorrect = isCorrect
        ? stats.correct_answers + 1
        : stats.correct_answers;
      const finalWrong = !isCorrect
        ? stats.wrong_answers + 1
        : stats.wrong_answers;
      setAnswersLog(nextLog);
      persistStats(nextLog, finalCorrect, finalWrong);
      setHasEnded(true);
      return;
    }

    setAnswersLog(nextLog);
    setQuestionIndex((i) => i + 1);
    setSelectedChoices(new Set());
  }, [
    currentQuestion,
    selectedChoices,
    answersLog,
    questionIndex,
    game.questions.length,
    stats.correct_answers,
    stats.wrong_answers,
    persistStats,
  ]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!currentQuestion) return;
      const num = Number(e.key);
      if (
        Number.isInteger(num) &&
        num >= 1 &&
        num <= currentQuestion.options.length
      ) {
        toggleChoice(num - 1);
      } else if (e.key === "Enter") {
        handleNext();
      } else if (e.key.toLowerCase() === "c") {
        setSelectedChoices(new Set());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [currentQuestion, toggleChoice, handleNext]);

  if (hasEnded) {
    return (
      <div className="absolute flex flex-col justify-center -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
        <div className="px-4 py-2 mt-2 font-semibold text-white bg-green-500 rounded-md whitespace-nowrap">
          You Completed in{" "}
          {formatTimeDelta(differenceInSeconds(now, startedAt))}
        </div>
        <Link
          href={`/dashboard/quizzes/${game.topic}/statistics/${game.id}`}
          className={cn(buttonVariants({ size: "lg" }), "mt-2")}
        >
          View Statistics
          <BarChart className="w-4 h-4 ml-2" />
        </Link>
      </div>
    );
  }

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 md:w-[80vw] max-w-4xl w-[90vw] top-1/2 left-1/2">
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          <p>
            <span className="text-slate-400">Topic</span>&nbsp;
            <span className="px-2 py-1 text-white rounded-lg bg-slate-800">
              {game.topic}
            </span>
          </p>
          <div className="flex self-start mt-3 text-slate-400">
            <Timer className="mr-2" />
            {formatTimeDelta(differenceInSeconds(now, startedAt))}
          </div>
        </div>
        <MCQCounter
          correct_answers={stats.correct_answers}
          wrong_answers={stats.wrong_answers}
        />
      </div>

      <Card className="w-full mt-4">
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="mr-5 text-center divide-y divide-zinc-600/50">
            <div>{questionIndex + 1}</div>
            <div className="text-base text-slate-400">
              {game.questions.length}
            </div>
          </CardTitle>
          <div className="flex flex-col flex-grow">
            <CardDescription className="text-lg">
              {currentQuestion?.question}
            </CardDescription>
            <span className="mt-1 text-xs text-slate-400">
              Select all that apply
            </span>
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-col items-center justify-center w-full mt-4">
        {currentQuestion?.options.map((option, index) => {
          const isSelected = selectedChoices.has(index);
          return (
            <Button
              key={`${currentQuestion.id}-${index}`}
              variant={isSelected ? undefined : "outline"}
              className="justify-start w-full py-8 mb-4"
              onClick={() => toggleChoice(index)}
            >
              <div className="flex items-center justify-start">
                <div className="p-2 px-3 mr-5 border rounded-md">
                  {numToLetter.get(index + 1)}
                </div>
                <div className="text-start">{option}</div>
              </div>
            </Button>
          );
        })}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="mt-2"
            size="lg"
            onClick={() => setSelectedChoices(new Set())}
          >
            Clear
          </Button>
          <Button
            className="mt-2"
            size="lg"
            disabled={selectedChoices.size === 0}
            onClick={handleNext}
          >
            Next <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MCQ;
