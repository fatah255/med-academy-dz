"use client";
import { AdminGetQuizCourses } from "@/app/data/admin/admin-get-quiz-cours";
import CoursCard from "./CoursCard";
import NewCourModal from "./addCoursQuizModal";

const QuizCours = ({
  cours,
  quizId,
}: {
  cours: AdminGetQuizCourses;
  quizId: string;
}) => {
  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <NewCourModal quizId={quizId} />
      </div>
      <div className="flex flex-col gap-4 items-center w-full">
        {cours.length === 0 ? (
          <p>No course available for this quiz.</p>
        ) : (
          cours.map((course) => <CoursCard key={course.id} cours={course} />)
        )}
      </div>
    </>
  );
};

export default QuizCours;
