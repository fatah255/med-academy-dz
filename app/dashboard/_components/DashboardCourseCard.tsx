"use client";

import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { EnrolledCourseType } from "@/app/data/user/get-inrolled-courses";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import useConstructUrl from "@/hooks/use-construct-url";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { BookAIcon, TimerIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const DashboardCourseCard = ({
  course,
  userId,
}: {
  course: EnrolledCourseType;
  userId: string;
}) => {
  const level = course.course.level.split("_").join(" ").toLowerCase();
  const thumbnailUrl = useConstructUrl(course.course.fileKey);
  const { progress, totalLessons, completedLessons } = useCourseProgress({
    course: course.course,
    userId,
  });
  const firstLesson = course.course.chapters[0]?.lesson[0];
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
        <Link
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
          href={`/courses/${course.course.slug}`}
        >
          {course.course.title}
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {course.course.smallDescription}
        </p>
        <div className="mt-4 flex items-center gap-x-5">
          <div className="flex items-center gap-x-2">
            <TimerIcon className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <p className="text-sm text-muted-foreground">
              {course.course.duration} hours
            </p>
          </div>
          <div className="flex items-center gap-x-2">
            <BookAIcon className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <p className="text-sm text-muted-foreground">
              {course.course.category}
            </p>
          </div>
        </div>
        <div className="mx-2 my-4 flex flex-col items-end justify-end">
          <Progress value={progress} max={100} />
          <p className="text-sm text-muted-foreground">{progress}% completed</p>
        </div>
        <Link
          className={buttonVariants({ className: "mt-4 w-full" })}
          href={`/dashboard/${course.course.slug}/${firstLesson?.id || ""}`}
        >
          {progress > 0 ? "Continue studying" : "Start Studying"}
        </Link>
      </CardContent>
    </Card>
  );
};
export default DashboardCourseCard;

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
