"use client";

import { EnrolledQuizType } from "@/app/data/user/get-enrolled-quizzes";

import { Badge } from "@/components/ui/badge";

import { Card, CardContent } from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";
import useConstructUrl from "@/hooks/use-construct-url";

import { BookAIcon, TimerIcon } from "lucide-react";
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
          totalQuestions={quiz?.quiz?.qcm.length || 0}
          quizId={quiz?.quiz?.id as string}
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
