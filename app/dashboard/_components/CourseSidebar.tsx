"use client";
import { CourseSidebarType } from "@/app/data/course/get-course-sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { ChevronDown, PlayIcon } from "lucide-react";
import LessonItem from "./LessonItem";
import { usePathname } from "next/navigation";
import { useCourseProgress } from "@/hooks/use-course-progress";

interface CourseSidebarProps {
  course: CourseSidebarType["course"];
  userId: string;
}

const CourseSidebar = ({ course, userId }: CourseSidebarProps) => {
  const pathname = usePathname();
  const currentLessonId = pathname.split("/").pop() || "";

  const { totalLessons, completedLessons, progress } = useCourseProgress({
    course,
    userId,
  });
  return (
    <div className="flex flex-col h-full">
      <div className="pb-4 pr-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <PlayIcon className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base leading-tight truncate">
              {course.title}
            </h1>
            <p>{course.category}</p>
          </div>
        </div>
        <div className="space-y-2 flex justify-between text-xs ">
          <span className="text-muted-foreground">Progress</span>
          <span>
            {" "}
            {completedLessons}/{totalLessons} lessons
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-muted-foreground text-xs">{progress}% Completed</p>
      </div>
      <div className="py-4 pr-2 space-y-3">
        {course.chapters.map((chapter) => (
          <Collapsible key={chapter.id} defaultOpen={chapter.position === 1}>
            <CollapsibleTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full p-3 h-auto flex items gap-2 "
              >
                <div className="shrink-0">
                  <ChevronDown className="size-4 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-sm truncate text-foreground ">
                    {chapter.position} : {chapter.title}
                  </p>
                  <p className="text-muted-foreground text-[10px] font-medium truncate">
                    {chapter.lesson.length} lessons
                  </p>
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 pl-6 border-l-2 space-y-3 ">
              {chapter.lesson.map((lesson) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  slug={course.slug}
                  isActive={lesson.id === currentLessonId}
                  completed={
                    lesson.progress.find((p) => p.lessonId === lesson.id)
                      ?.completed || false
                  }
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default CourseSidebar;
