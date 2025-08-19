import { Ban } from "lucide-react";
import { getAllCourses } from "../data/course/get-all-courses";
import { getInrolledCourses } from "../data/user/get-inrolled-courses";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import PublicCourseCard from "../(landing-page)/_components/PublicCourseCard";
import DashboardCourseCard from "./_components/DashboardCourseCard";
import { requireUser } from "../data/user/require-user";

const page = async () => {
  const [courses, enrolledCourses] = await Promise.all([
    getAllCourses(),
    getInrolledCourses(),
  ]);
  const session = await requireUser();

  if (!enrolledCourses || enrolledCourses.length === 0) {
    return (
      <div className="flex flex-1 flex-col h-full items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <Ban className="mb-4 h-12 w-12 text-primary" />
        <h2 className="mb-2 text-lg font-semibold">No Courses Available</h2>
        <p className="text-sm text-muted-foreground">
          You didn't enroll in any course yet.
        </p>
        <Link
          href="/courses"
          className={buttonVariants({
            className: "mt-4 w-full cursor-pointer",
          })}
        >
          Explore Courses
        </Link>
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Enrolled Courses</h1>
        <p className="text-muted-foreground">
          here you can see all your enrolled courses
        </p>
      </div>
      {enrolledCourses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrolledCourses.map((course) => (
              <DashboardCourseCard
                key={course.id}
                userId={session.user.id}
                course={course}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col h-full items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
          <Ban className="mb-4 h-12 w-12 text-primary" />
          <h2 className="mb-2 text-lg font-semibold">No Courses Available</h2>
          <p className="text-sm text-muted-foreground">
            You didn't enroll in any course yet.
          </p>
          <Link
            href="/courses"
            className={buttonVariants({
              className: "mt-4 w-full cursor-pointer",
            })}
          >
            Explore Courses
          </Link>
        </div>
      )}
    </>
  );
};

export default page;
