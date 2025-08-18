import { adminGetCourses } from "@/app/data/admin/admin-get-courses";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

import EmptyCourses from "@/components/general/EmptyCourses";
import { Suspense } from "react";
import { adminGetQuizzes } from "@/app/data/admin/admin-get-quizzes";
import QuizCard, { QuizCardSkeleton } from "./_components/QuizCard";
import EmptyQuizzes from "@/components/general/EmptyQuizzes";

const page = () => {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Quizzes</h1>
        <Link href="/admin/quizzes/create" className={buttonVariants()}>
          Create Quiz
        </Link>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <RenderCourses />
      </Suspense>
    </>
  );
};

export default page;

export async function RenderCourses() {
  const data = await adminGetQuizzes();
  return (
    <>
      {data.length === 0 ? (
        <EmptyQuizzes />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-7">
          {data.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-7">
      {Array.from({ length: 6 }).map((_, index) => (
        <QuizCardSkeleton key={index} />
      ))}
    </div>
  );
}
