import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import PublicCourseCard from "../../(landing-page)/_components/PublicCourseCard";
import DashboardCourseCard from "../_components/DashboardCourseCard";
import { requireUser } from "../../data/user/require-user";
import { getEnrolledQuizzes } from "@/app/data/user/get-enrolled-quizzes";
import { Ban } from "lucide-react";
import DashboardQuizCard from "./_components/DashboardQuizCard";

const page = async () => {
  const enrolledQuizzes = await getEnrolledQuizzes();
  const session = await requireUser();

  if (!enrolledQuizzes || enrolledQuizzes.length === 0) {
    return (
      <div className="flex flex-1 flex-col h-full items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <Ban className="mb-4 h-12 w-12 text-primary" />
        <h2 className="mb-2 text-lg font-semibold">No Quizzes Available</h2>
        <p className="text-sm text-muted-foreground">
          You didn't enroll in any quiz yet.
        </p>
        <Link
          href="/quizzes"
          className={buttonVariants({
            className: "mt-4 w-full cursor-pointer",
          })}
        >
          Explore Quizzes
        </Link>
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Enrolled Quizzes</h1>
        <p className="text-muted-foreground">
          here you can see all your enrolled quizzes
        </p>
      </div>
      {enrolledQuizzes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrolledQuizzes.map((quiz) => (
              <DashboardQuizCard
                key={quiz.id}
                userId={session.user.id}
                quiz={quiz}
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
