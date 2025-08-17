import { CourseSidebarType } from "@/app/data/course/get-course-sidebar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Play } from "lucide-react";
import Link from "next/link";

type lessonType =
  CourseSidebarType["course"]["chapters"][number]["lesson"][number];

const LessonItem = ({
  lesson,
  slug,
  isActive,
}: {
  lesson: lessonType;
  slug: string;
  isActive?: boolean;
}) => {
  const completed = false; // This should be replaced with actual logic to check if the lesson is completed
  return (
    <Link
      className={buttonVariants({
        variant: completed ? "secondary" : "outline",
        className: cn(
          "w-full p-2.5 h-auto justify-start transition-all",
          completed &&
            "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-800 dark:text-green-200",
          isActive &&
            !completed &&
            "bg-primary/10 dark:bg-primary/20 border-primary/50 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary"
        ),
      })}
      href={`/dashboard/${slug}/${lesson.id}`}
    >
      <div className="flex items-center gap-2.5 w-full min-h-0">
        <div className="shrink-0  1">
          {completed ? (
            <div className="size-5 p-1 rounded-full border-2 bg-background flex justify-center items-center">
              <Check className="size-4 text-green-800 dark:text-green-200" />
            </div>
          ) : (
            <div
              className={cn(
                "size-5 rounded-full border-2 bg-background flex justify-center items-center",
                isActive
                  ? "border-primary bg-primary/10 dark:bg-primary/20"
                  : "border-muted-foreground/50"
              )}
            >
              <Play
                className={cn(
                  "size-2.5 fill-current",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p
            className={cn(
              "text-xs font-medium truncate",
              completed && "line-through",
              isActive && "text-primary"
            )}
          >
            {lesson.position}. {lesson.title}
          </p>
          {completed && (
            <p className="text-xs text-muted-foreground">Completed</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default LessonItem;
