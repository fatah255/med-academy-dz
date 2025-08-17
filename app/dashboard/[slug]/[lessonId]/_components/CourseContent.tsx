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

interface CourseContentProps {
  lesson: LessonContentType;
}
const CourseContent = ({ lesson }: CourseContentProps) => {
  const VideoPlayer = ({
    videoKey,
    thumbnailKey,
  }: {
    videoKey: string | null;
    thumbnailKey: string | null;
  }) => {
    if (!videoKey) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
          <BookIcon className="size-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No video available</p>
        </div>
      );
    }
    let thumbnailUrl: string | undefined = undefined;
    if (thumbnailKey) {
      thumbnailUrl = useConstructUrl(thumbnailKey);
    }

    const videoUrl = useConstructUrl(videoKey);

    return (
      <div className="aspect-video bg-black relative rounded-lg overflow-hidden">
        <video
          className="w-full h-full object-cover"
          poster={thumbnailUrl}
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
  const [isPending, startTransition] = useTransition();
  const confetti = useConfetti;

  function onSubmit() {
    startTransition(async () => {
      const { data: response, error } = await tryCatch(
        markLessonAsCompleted(lesson.id, lesson.chapter.course.slug)
      );

      if (error) {
        toast.error("Something went wrong while updating the lesson");
      }
      if (response?.status === "success") {
        toast.success("Ypu have completed the lesson!");
        confetti();
      } else {
        toast.error(response?.message);
      }
    });
  }

  return (
    <div className="flex flex-col h-full bg-background pl-6">
      <VideoPlayer
        videoKey={lesson.videoKey}
        thumbnailKey={lesson.thumbnailKey}
      />
      <div className="py-4 border-b">
        {lesson.progress.length > 0 ? (
          <Button
            onClick={onSubmit}
            disabled={isPending}
            variant="outline"
            className="mb-4 cursor-pointer bg-green-500/10 text-green-500"
          >
            <CheckCircle className="size-4 mr-2 text-green-500" /> Completed
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={isPending}
            variant="outline"
            className="mb-4 cursor-pointer"
          >
            <CheckCircle className="size-4 mr-2 text-green-500" /> Complete
          </Button>
        )}
      </div>
      <div className="space-y-3 pt-3 ">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {lesson.title}
        </h1>
      </div>
    </div>
  );
};

export default CourseContent;
