import { Suspense } from "react";
import PublicCourseCard, {
  PublicCourseCardSkeleton,
} from "../_components/PublicCourseCard";
import { getAllCourses } from "@/app/data/course/get-all-courses";

import { getLevel, getSetupStatus } from "./actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import LevelToast from "./LevelToast";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default async function PublicCoursesroute() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAdmin = session?.user.role === "admin";
  const userId = session?.user.id;

  return (
    <div className="mt-5">
      <div className="flex flex-col space-y-2 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter ml-3">
          Explore Courses
        </h1>
        <p className="text-muted-foreground ml-3">
          Discover our wide range of courses designed to help you achieve your
          learning goals.
        </p>
        <Suspense fallback={<RenderCoursesSkeleton />}>
          <RenderCourses isAdmin={isAdmin} userId={userId as string} />
        </Suspense>
      </div>
    </div>
  );
}

async function RenderCourses({
  isAdmin,
  userId,
}: {
  isAdmin: boolean;
  userId: string;
}) {
  const courses = await getAllCourses();
  const level = await getLevel(userId);
  const isSetup = await getSetupStatus(userId);
  const coursesToRender =
    isAdmin || !userId
      ? courses
      : courses.filter((course) => course.level === level);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3 gap-9 m-5">
      {coursesToRender.map((course) => (
        <PublicCourseCard key={course.id} course={course} />
      ))}
      {coursesToRender.length === 0 && (
        <Card className="bg-background/50 border-2 border-dashed border-border col-span-full flex">
          <CardHeader>
            <h2 className="text-lg font-semibold mx-auto">
              No courses available for{" "}
              {level.split("_").join(" ").toLowerCase()}.
            </h2>
          </CardHeader>
          <CardContent className="mx-auto">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/settings"
            >
              update your study level
              <ArrowRight className="inline-block ml-1 size-4" />
            </Link>
            .
          </CardContent>
        </Card>
      )}
      <LevelToast isSetup={isSetup} level={level} userId={userId} />
    </div>
  );
}

export function RenderCoursesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3 gap-9 m-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <PublicCourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
