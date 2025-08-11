import { Suspense } from "react";
import PublicCourseCard, {
  PublicCourseCardSkeleton,
} from "../(landing-page)/_components/PublicCourseCard";
import { getAllCourses } from "../data/course/get-all-courses";

export default function PublicCoursesroute() {
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
          <RenderCourses />
        </Suspense>
      </div>
    </div>
  );
}

async function RenderCourses() {
  const courses = await getAllCourses();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3 gap-9 m-5">
      {courses.map((course) => (
        <PublicCourseCard key={course.id} course={course} />
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
