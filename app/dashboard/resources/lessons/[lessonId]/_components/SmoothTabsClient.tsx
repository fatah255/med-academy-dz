"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

import SmoothTab, { type TabItem } from "@/components/kokonutui/SmoothTab";
import {
  IconVideo,
  IconFileTypePdf,
  IconExternalLink,
  IconCube3dSphere,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { YouTubePlayer } from "../_components/youtube-player";
import { PdfViewer } from "../_components/pdf-viewer";
import { SketchfabViewer } from "../_components/sketchfab-viewer";

/** Plain serializable shapes coming from the server */
type SimpleItem = { id: string; title: string; url: string };

export default function SmoothTabsClient({
  videos,
  pdfs,
  links,
  models,
  className,
}: {
  videos: SimpleItem[];
  pdfs: SimpleItem[];
  links: SimpleItem[];
  models: SimpleItem[];
  className?: string;
}) {
  const items: TabItem[] = [
    {
      id: "videos",
      title: "Videos",
      icon: IconVideo,
      count: videos.length,
      color: "bg-sky-500",
      cardContent: (
        <Banner
          title="Videos"
          subtitle="Watch the lesson videos here"
          tone="sky"
        />
      ),
      content: (
        <div className="flex flex-col gap-4">
          {videos.map((v) => (
            <Card key={v.id} className="border-muted/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{v.title}</CardTitle>
                <CardDescription>Video</CardDescription>
              </CardHeader>
              <CardContent>
                <YouTubePlayer value={v.url} title={v.title} />
              </CardContent>
            </Card>
          ))}
          {videos.length === 0 && <Empty text="No videos yet." />}
        </div>
      ),
    },
    {
      id: "pdfs",
      title: "PDFs",
      icon: IconFileTypePdf,
      count: pdfs.length,
      color: "bg-indigo-500",
      cardContent: (
        <Banner
          title="PDFs"
          subtitle="Slides and reading material"
          tone="indigo"
        />
      ),
      content: (
        <div className="flex flex-col gap-4">
          {pdfs.map((p) => (
            <Card key={p.id} className="border-muted/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.title}</CardTitle>
                <CardDescription>PDF</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PdfViewer src={p.url} title={p.title} />
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                >
                  Open <IconExternalLink className="size-4" />
                </a>
              </CardContent>
            </Card>
          ))}
          {pdfs.length === 0 && <Empty text="No PDFs yet." />}
        </div>
      ),
    },
    {
      id: "links",
      title: "Links",
      icon: IconExternalLink,
      count: links.length,
      color: "bg-rose-500",
      cardContent: (
        <Banner
          title="Links"
          subtitle="External references & sites"
          tone="rose"
        />
      ),
      content: (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((l) => (
            <Card key={l.id} className="border-muted/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{l.title}</CardTitle>
                <CardDescription>External Link</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                >
                  Open <IconExternalLink className="size-4" />
                </a>
              </CardContent>
            </Card>
          ))}
          {links.length === 0 && (
            <div className="col-span-full">
              <Empty text="No links yet." />
            </div>
          )}
        </div>
      ),
    },
    {
      id: "models",
      title: "3D Models",
      icon: IconCube3dSphere,
      count: models.length,
      color: "bg-emerald-500",
      cardContent: (
        <Banner
          title="3D Models"
          subtitle="Interactive anatomy models"
          tone="emerald"
        />
      ),
      content: (
        <div className="flex flex-col gap-4">
          {models.map((m) => (
            <Card key={m.id} className="border-muted/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{m.title}</CardTitle>
                <CardDescription>3D Model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SketchfabViewer url={m.url} title={m.title} />
              </CardContent>
            </Card>
          ))}
          {models.length === 0 && <Empty text="No 3D models yet." />}
        </div>
      ),
    },
  ];

  return <SmoothTab items={items} className={className} />;
}

/* ---------- Little helpers (client-side) ---------- */

function WaveformPath() {
  return (
    <motion.path
      d="M0 50 C 20 40, 40 30, 60 50 C 80 70, 100 60, 120 50 C 140 40, 160 30, 180 50 C 200 70, 220 60, 240 50 C 260 40, 280 30, 300 50 C 320 70, 340 60, 360 50 C 380 40, 400 30, 420 50 L 420 100 L 0 100 Z"
      initial={false}
      animate={{
        x: [0, 10, 0],
        transition: {
          duration: 5,
          ease: "linear",
          repeat: Number.POSITIVE_INFINITY,
        },
      }}
    />
  );
}

function Banner({
  title,
  subtitle,
  tone,
}: {
  title: string;
  subtitle: string;
  tone: "sky" | "indigo" | "rose" | "emerald";
}) {
  const color = {
    sky: "fill-sky-500 stroke-sky-500",
    indigo: "fill-indigo-500 stroke-indigo-500",
    rose: "fill-rose-500 stroke-rose-500",
    emerald: "fill-emerald-500 stroke-emerald-500",
  }[tone];
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute bottom-0 h-32 w-full"
          viewBox="0 0 420 100"
          preserveAspectRatio="none"
        >
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 0.5 }}
            className={cn(color)}
            style={{ strokeWidth: 1 }}
          >
            <WaveformPath />
          </motion.g>
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 0.5 }}
            className={cn(color)}
            style={{ strokeWidth: 1, transform: "translateY(10px)" }}
          >
            <WaveformPath />
          </motion.g>
        </svg>
      </div>
      <div className="relative flex h-full flex-col p-6">
        <div className="space-y-1.5">
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="max-w-[90%] text-sm text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>
  );
}
