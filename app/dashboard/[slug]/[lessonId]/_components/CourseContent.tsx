"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import clsx from "clsx";

import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { Button } from "@/components/ui/button";
import useConstructUrl from "@/hooks/use-construct-url";
import { BookIcon, CheckCircle, Play } from "lucide-react";
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
/* Utilities                                                           */
/* ------------------------------------------------------------------ */

function getOrigin(url?: string | null) {
  try {
    if (!url) return null;
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function looksLikeHls(url: string) {
  return /\.m3u8(\?|$)/i.test(url) || /([?&])format=hls(&|$)/i.test(url);
}

/* ------------------------------------------------------------------ */
/* Smart video (lazy + HLS fallback)                                  */
/* ------------------------------------------------------------------ */

function SmartVideo({
  videoUrl,
  poster,
  className,
}: {
  videoUrl: string;
  poster?: string;
  className?: string;
}) {
  const [inView, setInView] = useState(false);
  const [armed, setArmed] = useState(false);
  const [metaReady, setMetaReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isHls = looksLikeHls(videoUrl);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);

  const onArmAndPlay = async () => {
    setArmed(true);
    const el = videoRef.current;
    if (!el) return;

    if (
      isHls &&
      !("canPlayType" in el && el.canPlayType("application/vnd.apple.mpegurl"))
    ) {
      try {
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true });
          hls.loadSource(videoUrl);
          hls.attachMedia(el);
        } else {
          el.src = videoUrl;
        }
      } catch {
        el.src = videoUrl;
      }
    } else {
      el.src = videoUrl;
    }

    try {
      await el.play();
    } catch {
      /* ignore – controls are visible */
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx(
        "relative aspect-video overflow-hidden rounded-lg bg-black",
        className
      )}
    >
      {!inView ? (
        <Skeleton className="absolute inset-0 rounded-none" />
      ) : (
        <>
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster={poster}
            controls={armed}
            playsInline
            disableRemotePlayback
            controlsList="nodownload"
            preload={armed ? "auto" : "metadata"}
            onLoadedMetadata={() => setMetaReady(true)}
          />
          {!armed && (
            <button
              aria-label="Play"
              className="absolute inset-0 grid place-items-center bg-black/30 hover:bg-black/40 transition"
              onClick={onArmAndPlay}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-black">
                <Play className="h-4 w-4" />
                Play
              </span>
            </button>
          )}
          {armed && !metaReady && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[pulse_1.2s_ease-in-out_infinite]" />
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

interface CourseContentProps {
  lesson: LessonContentType;
}

const CourseContent = ({ lesson }: CourseContentProps) => {
  const [isPending, startTransition] = useTransition();
  const confetti = useConfetti; // ✅ call the hook to get the trigger fn

  const hasMux = true;
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

  const NoVideo = (
    <div className="aspect-video rounded-lg bg-muted flex flex-col items-center justify-center">
      <BookIcon className="size-16 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">No video available</p>
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-4 bg-background px-4 sm:px-6 py-4">
      {/* Networking hints */}
      <Head>
        {origin && (
          <>
            <link rel="preconnect" href={origin} crossOrigin="" />
            <link rel="dns-prefetch" href={origin} />
          </>
        )}
        {hasMux && (
          <>
            <link rel="preconnect" href="https://stream.mux.com" />
            <link rel="preconnect" href="https://image.mux.com" />
            <link rel="dns-prefetch" href="https://stream.mux.com" />
            <link rel="dns-prefetch" href="https://image.mux.com" />
          </>
        )}
      </Head>

      {/* Prefer Mux if we have a playback id; else fall back to your video */}
      {hasMux ? (
        <MuxPlayer
          // NOTE: make sure lesson.muxVideoId is a **Mux playback ID**.
          // (If you stored an Asset ID instead, create a playback ID for it and store that.)
          playbackId={lesson.muxVideoId || ""}
          poster={poster}
          streamType="on-demand"
          className="aspect-video rounded-lg overflow-hidden"
          accent-color="#1c9cf0"
          // optional nice-to-haves:
          // autoPlay
          // muted
          // primaryColor="#22c55e"
        />
      ) : lesson.videoKey ? (
        <SmartVideo videoUrl={videoUrl} poster={poster} />
      ) : (
        NoVideo
      )}

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
/* Skeleton                                                            */
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
