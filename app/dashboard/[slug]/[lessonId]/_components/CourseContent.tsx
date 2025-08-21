"use client";

import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { Button } from "@/components/ui/button";
import useConstructUrl from "@/hooks/use-construct-url";
import { BookIcon, CheckCircle } from "lucide-react";
import { useTransition } from "react";
import { markLessonAsCompleted } from "../actions";
import { toast } from "sonner";
import { tryCatch } from "@/hooks/try-catch";
import { useConfetti } from "@/hooks/use-confetti";
import { Skeleton } from "@/components/ui/skeleton";

interface CourseContentProps {
  lesson: LessonContentType;
}

const CourseContent = ({ lesson }: CourseContentProps) => {
  const [isPending, startTransition] = useTransition();
  const confetti = useConfetti; // call the hook so we can call confetti()

  const VideoPlayer = ({
    videoKey,
    thumbnailKey,
  }: {
    videoKey: string | null;
    thumbnailKey: string | null;
  }) => {
    if (!videoKey) {
      return (
        <div className="aspect-video rounded-lg bg-muted flex flex-col items-center justify-center">
          <BookIcon className="size-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No video available</p>
        </div>
      );
    }

    const videoUrl = useConstructUrl(videoKey);
    const poster = thumbnailKey ? useConstructUrl(thumbnailKey) : undefined;

    return (
      <div className="aspect-video relative rounded-lg overflow-hidden bg-black">
        <video
          className="h-full w-full object-cover"
          poster={poster}
          controls
          controlsList="nodownload"
          playsInline
          preload="metadata"
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
          Your browser does not support the video playing.
        </video>
      </div>
    );
  };

  function onSubmit() {
    startTransition(async () => {
      const { data: response, error } = await tryCatch(
        markLessonAsCompleted(lesson.id, lesson.chapter.course.slug)
      );

      if (error) {
        toast.error("Something went wrong while updating the lesson");
        return;
      }
      if (response?.status === "success") {
        toast.success("You have completed the lesson!");
        confetti();
      } else {
        toast.error(response?.message ?? "Could not complete lesson");
      }
    });
  }

  return (
    <div className="flex h-full flex-col gap-4 bg-background px-4 sm:px-6 py-4">
      <VideoPlayer
        videoKey={lesson.videoKey}
        thumbnailKey={lesson.thumbnailKey}
      />

      <div className="border-b pb-4">
        {lesson.progress.length > 0 ? (
          <Button
            onClick={onSubmit}
            disabled={isPending}
            variant="outline"
            className="mb-2 bg-green-500/10 text-green-600"
          >
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            Completed
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={isPending}
            variant="outline"
            className="mb-2"
          >
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            Complete
          </Button>
        )}
      </div>

      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {lesson.title}
        </h1>
      </div>
    </div>
  );
};

export default CourseContent;

export const CourseContentSkeleton = () => {
  return (
    <div className="flex h-full flex-col gap-4 bg-background px-4 sm:px-6 py-4">
      <Skeleton className="aspect-video rounded-lg bg-muted" />
      <div className="border-b pb-4">
        <Skeleton className="h-10 w-32 mb-2" />
      </div>
      <div className="pt-1">
        <Skeleton className="h-8 w-1/2" />
      </div>
    </div>
  );
};
