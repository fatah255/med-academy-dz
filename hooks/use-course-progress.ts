"use client";

import { CourseSidebarType } from "@/app/data/course/get-course-sidebar";
import { useMemo } from "react";

interface CourseProgressResult {
  totalLessons: number;
  completedLessons: number;
  progress: number;
}

export function useCourseProgress({
  course,
  userId,
}: {
  course: CourseSidebarType["course"];
  userId: string;
}): CourseProgressResult {
  return useMemo(() => {
    let totalLessons = 0;
    let completedLessons = 0;
    course.chapters.forEach((chapter) => {
      chapter.lesson.forEach((lesson) => {
        totalLessons++;
        const isCompleted = lesson.progress.some(
          (p) => p.lessonId === lesson.id && p.userId === userId && p.completed
        );
        if (isCompleted) {
          completedLessons++;
        }
      });
    });
    const progress =
      completedLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;
    return {
      totalLessons,
      completedLessons,
      progress,
    };
  }, [course]);
}
