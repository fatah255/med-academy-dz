// File: app/dashboard/attempts/page.tsx
import { prisma } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Trophy,
  Timer,
  BookOpen,
  TestTubes,
  GraduationCap,
} from "lucide-react";
import { requireUser } from "@/app/data/user/require-user";

function fmtDur(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

export const dynamic = "force-dynamic";

export default async function AttemptsPage() {
  const session = await requireUser();
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      quiz: true,
      cours: true,
      exam: true,
      user: { select: { name: true, email: true, id: true } },
    },
  });

  return (
    <div className="mx-auto w-[95vw] max-w-6xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Recent Attempts
          </h1>
          <p className="text-sm text-muted-foreground">
            Review your latest quiz runs and jump into full breakdowns.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {attempts.map((a) => {
          const linkTo = `/dashboard/attempts/${a.id}`;
          const label =
            a.quiz?.title ?? a.cours?.title ?? a.exam?.title ?? a.topic;
          const moduleLabel = a.quiz
            ? "Quiz"
            : a.cours
            ? "Cours"
            : a.exam
            ? "Exam"
            : "Topic";
          const icon = a.quiz ? (
            <TestTubes className="h-4 w-4" />
          ) : a.cours ? (
            <BookOpen className="h-4 w-4" />
          ) : a.exam ? (
            <GraduationCap className="h-4 w-4" />
          ) : (
            <BookOpen className="h-4 w-4" />
          );
          const score =
            a.scorePercent ??
            Math.round((a.correctCount * 100) / Math.max(1, a.attempted));
          return (
            <Link key={a.id} href={linkTo}>
              <Card className="group hover:shadow-md transition-shadow">
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      {icon}
                      {moduleLabel}
                    </span>
                    <span>•</span>
                    <span>{format(a.createdAt, "PPp")}</span>
                  </div>
                  <CardTitle className="line-clamp-1">{label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="inline-flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      <span>{score}%</span>
                    </div>
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span>{fmtDur(a.durationSeconds)}</span>
                    </div>
                  </div>
                  <Progress value={score} />
                  <div className="flex items-center justify-between text-xs">
                    <div className="space-x-2">
                      <Badge variant={a.completedAll ? "default" : "secondary"}>
                        {a.completedAll ? "Completed" : "Ended early"}
                      </Badge>
                      <Badge variant="outline">{a.attempted} answered</Badge>
                    </div>
                    <div className="inline-flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform">
                      <span>Open</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
