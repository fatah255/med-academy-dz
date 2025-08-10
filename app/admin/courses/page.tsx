import { adminGetCourses } from "@/app/data/admin/admin-get-courses";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import CourseCard, { CourseCardSkeleton } from "./_components/CourseCard";
import EmptyCourses from "@/components/general/EmptyCourses";
import { Suspense } from "react";

const page = () => {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Courses</h1>
        <Link href="/admin/courses/create" className={buttonVariants()}>
          Create Course
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
  const data = await adminGetCourses();
  return (
    <>
      {data.length === 0 ? (
        <EmptyCourses />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-7">
          {data.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-7">
      {Array.from({ length: 4 }).map((_, index) => (
        <CourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
