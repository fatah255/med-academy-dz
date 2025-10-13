"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import clsx from "clsx";

import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { Button } from "@/components/ui/button";
import useConstructUrl from "@/hooks/use-construct-url";
import { BookIcon, CheckCircle, Play, Loader2 } from "lucide-react";
import { markLessonAsCompleted } from "../actions";
import { toast } from "sonner";
import { tryCatch } from "@/hooks/try-catch";
import { useConfetti } from "@/hooks/use-confetti";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------- Mux (client-only) ------------------------- */
const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
});

/* ------------------------------------------------------------------ */
/* Utility functions                                                  */
/* ------------------------------------------------------------------ */
function getOrigin(url?: string | null) {
  try {
    if (!url) return null;
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

interface CourseContentProps {
  lesson: LessonContentType;
}

const CourseContent = ({ lesson }: CourseContentProps) => {
  const [isPending, startTransition] = useTransition();
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0); // for forcing remount on retry
  const confetti = useConfetti;

  const videoUrl = useConstructUrl(lesson.videoKey || "");
  const poster = lesson.thumbnailKey
    ? useConstructUrl(lesson.thumbnailKey)
    : undefined;
  const origin = useMemo(() => getOrigin(videoUrl), [videoUrl]);

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

  function handleRetry() {
    setHasError(false);
    setIsReady(false);
    setRetryKey((k) => k + 1);
  }

  const NoVideo = (
    <div className="aspect-video rounded-lg bg-muted flex flex-col items-center justify-center">
      <BookIcon className="size-16 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">No video available</p>
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-4 bg-background px-4 sm:px-6 py-4">
      <Head>
        {origin && (
          <>
            <link rel="preconnect" href={origin} crossOrigin="" />
            <link rel="dns-prefetch" href={origin} />
          </>
        )}
        <link rel="preconnect" href="https://stream.mux.com" />
        <link rel="preconnect" href="https://image.mux.com" />
        <link rel="dns-prefetch" href="https://stream.mux.com" />
        <link rel="dns-prefetch" href="https://image.mux.com" />
      </Head>

      {/* ----------------------- VIDEO PLAYER ------------------------ */}
      {lesson.muxVideoId ? (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
          {!isReady && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm opacity-80">Loading video...</p>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-4">
              <p className="font-semibold text-red-400 mb-1">Network Error</p>
              <p className="text-sm opacity-80 text-center mb-3">
                The video failed to load. Please check your connection or try
                again.
              </p>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          )}

          {!hasError && (
            <MuxPlayer
              key={retryKey}
              title={lesson.title}
              playbackId={lesson.muxVideoId}
              poster={poster}
              streamType="on-demand"
              className={clsx(
                "h-full w-full rounded-lg transition-opacity duration-500",
                !isReady ? "opacity-0" : "opacity-100"
              )}
              accentColor="#1c9cf0"
              onCanPlay={() => setIsReady(true)}
              onError={(err) => {
                console.error("MuxPlayer error:", err);
                setHasError(true);
              }}
              autoPlay
              playsInline
              preload="auto"
              muted
            />
          )}
        </div>
      ) : (
        NoVideo
      )}

      {/* -------------------- COMPLETE BUTTON -------------------- */}
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

/* ------------------------------------------------------------------ */
/* Skeleton                                                           */
/* ------------------------------------------------------------------ */

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
