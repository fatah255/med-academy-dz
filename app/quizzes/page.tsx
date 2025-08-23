import { Suspense } from "react";
import { PublicCourseCardSkeleton } from "../(landing-page)/_components/PublicCourseCard";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getLevel } from "../courses/actions";
import { getAllQuizzes } from "../data/quiz/get-all-quizzes";
import PublicQuizCard from "./_components/PublicQuizCard";

export default async function PublicQuizzesRoute() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAdmin = session?.user.role === "admin";
  const userId = session?.user.id;
  return (
    <div className="mt-5">
      <div className="flex flex-col space-y-2 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter ml-3">
          Explore Quizzes
        </h1>
        <p className="text-muted-foreground ml-3">
          Discover our wide range of quizzes designed to help you achieve your
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
  const courses = await getAllQuizzes();
  const level = await getLevel(userId);
  const coursesToRender =
    isAdmin || !userId
      ? courses
      : courses.filter((course) => course.level === level);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3 gap-9 m-5">
      {coursesToRender.map((course) => (
        <PublicQuizCard key={course.id} course={course} />
      ))}
    </div>
  );
}

function RenderCoursesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3 gap-9 m-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <PublicCourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
