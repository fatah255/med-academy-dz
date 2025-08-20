"use client";

import React from "react";
import Link from "next/link";
import { differenceInSeconds } from "date-fns";
import { LucideLayoutDashboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import ResultsCard from "./ResultsCard";
import AccuracyCard from "./AccuracyCard";
import TimeTakenCard from "./TimeTakenCard";
import QuestionsList from "./QuestionsList";

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
  startedAt: string; // ISO
  endedAt: string; // ISO
  durationSeconds: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  answers: AnswerLog[];
};

const STORAGE_KEY = (gameId: string) => `mcq:stats:${gameId}`;

export default function StatsClient({ gameId }: { gameId: string }) {
  const [stats, setStats] = React.useState<GameStats | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(gameId));
      if (raw) setStats(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, [gameId]);

  if (!stats) {
    return (
      <div className="p-8 mx-auto max-w-7xl">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Summary</h2>
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className={buttonVariants()}>
              <LucideLayoutDashboard className="mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-6 text-muted-foreground">
          No saved stats were found for this game. Start a quiz to see results
          here.
        </div>
      </div>
    );
  }

  // Recompute basic numbers (in case)
  const total = stats.totalQuestions ?? stats.answers.length;
  const correct =
    stats.correctCount ?? stats.answers.filter((a) => a.isCorrect).length;
  const wrong = total - correct;
  const accuracy = total ? Math.round((correct / total) * 100 * 100) / 100 : 0;

  // If durationSeconds wasn't saved (older runs), compute it
  const started = new Date(stats.startedAt);
  const ended = new Date(stats.endedAt);
  const durationSeconds = Number.isFinite(stats.durationSeconds)
    ? stats.durationSeconds
    : differenceInSeconds(ended, started);

  return (
    <div className="p-8 mx-auto max-w-7xl">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Summary</h2>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard" className={buttonVariants()}>
            <LucideLayoutDashboard className="mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="grid gap-4 mt-4 md:grid-cols-7">
        <ResultsCard accuracy={accuracy} />
        <AccuracyCard accuracy={accuracy} />
        <TimeTakenCard timeEnded={ended} timeStarted={started} />
      </div>

      <QuestionsList answers={stats.answers} />
    </div>
  );
}
