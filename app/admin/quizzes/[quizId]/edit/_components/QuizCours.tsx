"use client";

import CoursCard, { type ModuleOption } from "./CoursCard";
import NewCourModal from "./addCoursQuizModal";

// One row of cours:
export type AdminGetQuizCoursesCours = {
  id: string;
  title: string;
  quizId: string;
  quizModuleId: string | null;
};

// The list you’re already receiving:
export type AdminGetQuizCourses = AdminGetQuizCoursesCours[];

const QuizCours = ({
  cours,
  quizId,
  isUnite,
  modules, // 👈 add module options here
}: {
  cours: AdminGetQuizCourses;
  quizId: string;
  isUnite: boolean; // 👈 add this
  modules: ModuleOption[]; // 👈 and this
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
          cours.map((course) => (
            <CoursCard
              key={course.id}
              cours={course}
              isUnite={isUnite} // 👈 pass down
              modules={modules} // 👈 pass down
            />
          ))
        )}
      </div>
    </>
  );
};

export default QuizCours;
