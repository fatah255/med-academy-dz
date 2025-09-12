"use client";

import * as React from "react";

// Extracts the 11-char ID from most YouTube URL shapes
function extractYouTubeId(input: string): string | null {
  if (!input) return null;

  // Already a raw ID?
  const rawId = input.match(/^[A-Za-z0-9_-]{11}$/)?.[0];
  if (rawId) return rawId;

  // Common URL shapes
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/.*[?&]v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];

  for (const rx of patterns) {
    const m = input.match(rx);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function YouTubePlayer({
  value, // url or id
  title,
  className,
}: {
  value: string;
  title?: string;
  className?: string;
}) {
  const id = extractYouTubeId(value);
  // if we somehow couldn't extract, fall back to trusting a full URL
  const src = id
    ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`
    : value;

  return (
    <div
      className={`aspect-video w-full overflow-hidden rounded-lg bg-muted ${
        className ?? ""
      }`}
    >
      <iframe
        src={src}
        title={title ?? "YouTube video"}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
