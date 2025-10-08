import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Trophy,
  Timer,
  Info,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import CommentHtml from "@/components/attempts/CommentHtml";
import { DownloadCorrectionButton } from "./DownloadCorrectionButton";

function fmtDur(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function letters(indices: number[]) {
  const map = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  return indices.map((i) => map[i] ?? `#${i + 1}`).join(", ");
}

export const dynamic = "force-dynamic";

export default async function AttemptDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id },
    include: { quiz: true, cours: true, exam: true, user: true },
  });
  if (!attempt) return notFound();

  const answers = Array.isArray(attempt.answers)
    ? (attempt.answers as any)
    : [];

  const byId = new Map(answers.map((a: any) => [a.questionId, a]));

  const qcms = attempt.qcmIds.length
    ? await prisma.qcm.findMany({
        where: { id: { in: attempt.qcmIds } },
        include: { answers: { orderBy: { position: "asc" } } },
      })
    : [];

  const orderedQcms = attempt.qcmIds
    .map((id) => qcms.find((q) => q.id === id))
    .filter(Boolean) as typeof qcms;

  const label =
    attempt.quiz?.title ??
    attempt.cours?.title ??
    attempt.exam?.title ??
    attempt.topic;

  const score =
    attempt.scorePercent ??
    Math.round((attempt.correctCount * 100) / Math.max(1, attempt.attempted));

  const correct = attempt.correctCount;
  const wrong = attempt.wrongCount;

  return (
    <div className="mx-auto w-[95vw] max-w-6xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/attempts"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to attempts
        </Link>
        <div className="text-xs text-muted-foreground">{attempt.id}</div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="text-xl">{label}</CardTitle>
              <CardDescription>
                {format(attempt.createdAt, "PPpp")} • {attempt.topic}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={attempt.completedAll ? "default" : "secondary"}>
                {attempt.completedAll ? "Completed" : "Ended early"}
              </Badge>
              {attempt.quiz && <Badge variant="outline">Quiz</Badge>}
              {attempt.cours && <Badge variant="outline">Cours</Badge>}
              {attempt.exam && <Badge variant="outline">Exam</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-xs text-muted-foreground">Score</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-medium">
                <Trophy className="h-5 w-5" /> {score}%
              </div>
              <div className="text-xs text-muted-foreground">
                {correct} correct / {wrong} wrong
              </div>
            </div>
            <Progress className="mt-3" value={score} />
          </div>

          <div className="rounded-xl border p-4">
            <div className="mb-2 text-xs text-muted-foreground">Timing</div>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <Timer className="h-5 w-5" />
                <span className="font-medium">
                  {fmtDur(attempt.durationSeconds)}
                </span>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>Started: {format(attempt.startedAt, "PPp")}</div>
                <div>Ended: {format(attempt.endedAt, "PPp")}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="mb-2 text-xs text-muted-foreground">Counts</div>
            <div className="grid grid-cols-3 text-center">
              <div>
                <div className="text-2xl font-semibold">
                  {attempt.totalQuestions}
                </div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">
                  {attempt.attempted}
                </div>
                <div className="text-xs text-muted-foreground">Answered</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">
                  {attempt.totalQuestions - attempt.attempted}
                </div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="correction" className="w-full">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="correction">Correction</TabsTrigger>
        </TabsList>

        <TabsContent value="correction" className="mt-4 space-y-4">
          {orderedQcms.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No questions found</CardTitle>
                <CardDescription>This attempt has no QCM data.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              {false && (
                <div className="flex justify-end mb-4">
                  {/* @ts-ignore */}
                  <DownloadCorrectionButton qcms={orderedQcms} label={label} />
                </div>
              )}

              {orderedQcms.map((qcm, idx) => {
                const opts = qcm.answers.sort(
                  (a, b) => a.position - b.position
                );
                const correctIdx = opts
                  .filter((a) => a.isCorrect)
                  .map((a) => a.position - 1);

                const user = byId.get(qcm.id);
                //@ts-ignore
                const userIdx = user?.selectedIndices ?? [];
                const userSet = new Set(userIdx);
                const correctSet = new Set(correctIdx);

                const correctLetters = letters(correctIdx);
                const userPickedLetters = letters(userIdx);

                const answered = !!user;
                const isCorrect =
                  answered &&
                  userIdx.length > 0 &&
                  userIdx.length === correctIdx.length &&
                  userIdx.every((i: number) => correctSet.has(i));

                return (
                  <Card key={qcm.id}>
                    <CardHeader>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">
                          Q{idx + 1}
                        </span>
                        <div className="inline-flex gap-2">
                          {answered ? (
                            isCorrect ? (
                              <Badge className="bg-green-600">Correct</Badge>
                            ) : (
                              <Badge className="bg-red-600">Wrong</Badge>
                            )
                          ) : (
                            <Badge variant="secondary">Skipped</Badge>
                          )}
                          <Badge variant="outline">{opts.length} options</Badge>
                        </div>
                      </div>
                      <CardTitle className="text-base">
                        {qcm.question}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Your answer:{" "}
                        <span className="font-medium">
                          {answered ? userPickedLetters || "—" : "—"}
                        </span>{" "}
                        · Correct:{" "}
                        <span className="font-medium">
                          {correctLetters || "—"}
                        </span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-2">
                        {opts.map((opt) => {
                          const idx0 = opt.position - 1;
                          const picked = userSet.has(idx0);
                          const should = correctSet.has(idx0);
                          const tone = should
                            ? "border-green-500 bg-green-500/10 text-green-400"
                            : picked
                            ? "border-red-500 bg-red-500/10 text-red-400"
                            : "border-muted bg-muted/10";
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-start gap-3 rounded-xl border p-3 ${tone}`}
                            >
                              <div className="mt-0.5 w-5 text-center text-xs font-mono rounded border bg-background">
                                {String.fromCharCode(65 + idx0)}
                              </div>
                              <div className="flex-1">{opt.text}</div>
                            </div>
                          );
                        })}
                      </div>

                      {qcm.comment ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Show Comment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl overflow-hidden p-0">
                            <DialogHeader className="px-4 pt-4">
                              <DialogTitle>Commentary</DialogTitle>
                              <DialogDescription className="text-xs">
                                Explanation for this question.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[80vh] overflow-y-auto px-4 pb-4">
                              <div className="prose prose-invert max-w-none">
                                <CommentHtml html={qcm.comment ?? ""} />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Info className="h-3.5 w-3.5" /> No comment provided.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
