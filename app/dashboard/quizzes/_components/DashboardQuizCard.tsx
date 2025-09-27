"use client";

import { EnrolledQuizType } from "@/app/data/user/get-enrolled-quizzes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import useConstructUrl from "@/hooks/use-construct-url";
import { BookAIcon } from "lucide-react";
import Image from "next/image";
import StartTest from "./StartTestModal";

const DashboardQuizCard = ({
  quiz,
}: {
  quiz: EnrolledQuizType;
  userId: string;
}) => {
  const level = quiz.quiz?.level.split("_").join(" ").toLowerCase();
  const thumbnailUrl = useConstructUrl(quiz.quiz?.fileKey || "");

  // Build a per-course year index: { [courseId]: { [year]: count } }
  const yearIndex: Record<string, Record<number, number>> = Object.fromEntries(
    (quiz.quiz?.cours ?? []).map((c) => {
      const counts: Record<number, number> = {};
      for (const q of c.qcm ?? []) {
        const y = q?.examYear;
        if (typeof y === "number") {
          counts[y] = (counts[y] ?? 0) + 1;
        }
      }
      return [c.id, counts];
    })
  );

  // Global min/max (only from items having examYear)
  const allYears = Object.values(yearIndex).flatMap((m) =>
    Object.keys(m).map(Number)
  );
  const globalMinYear = allYears.length ? Math.min(...allYears) : undefined;
  const globalMaxYear = allYears.length ? Math.max(...allYears) : undefined;

  return (
    <Card className="group relative py-0 gap-0 space-y-3">
      <Badge className="absolute top-2 right-2 z-10 p-2 font-medium">
        {level}
      </Badge>
      <Image
        className="w-full rounded-t-xl h-full aspect-video object-cover"
        src={thumbnailUrl}
        alt="cover image"
        width={600}
        height={400}
      />
      <CardContent className="p-4">
        <div className="font-medium text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {quiz.quiz?.title}
        </div>

        <div className="mt-4 flex items-center gap-x-5">
          <div className="flex items-center gap-x-2">
            <BookAIcon className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <p className="text-sm text-muted-foreground">
              {quiz.quiz?.category}
            </p>
          </div>
        </div>

        <StartTest
          totalQuestions={
            quiz?.quiz?.cours
              ?.map((c) => c.qcm.length)
              .reduce((a, b) => a + b, 0) || 0
          }
          quizId={quiz?.quiz?.id as string}
          coursOptions={
            quiz?.quiz?.cours.map((c) => ({
              id: c.id,
              title: c.title,
              questionCount: c.qcm.length,
            })) || []
          }
          yearIndex={yearIndex}
          globalMinYear={globalMinYear}
          globalMaxYear={globalMaxYear}
        />
      </CardContent>
    </Card>
  );
};
export default DashboardQuizCard;

export function DashboardCourseCardSkeleton() {
  return (
    <Card className="group relative py-0 gap-0">
      <div className="absolute top-2 right-2 z-10 p-2 font-medium flex items-center">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="w-full h-fit relative">
        <Skeleton className="rounded-t-xl w-full aspect-video" />
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
