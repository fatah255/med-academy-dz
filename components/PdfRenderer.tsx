"use client";
// import "@/lib/setup-pdf-worker";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import SimpleBar from "simplebar-react";
import { useResizeDetector } from "react-resize-detector";
import { initPdfWorker } from "@/lib/setup-pdf-worker";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCw,
  Search,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import PdfFullscreen from "./PdfFullscreen";
import { useToast } from "./ui/use-toast";

// ✅ initialize pdf.js worker once (no CDN)

// If you want selectable/searchable text/links, keep these 2 CSS imports.
// If you disable text/annotation layers (see below), you can delete these imports.
// import 'react-pdf/dist/Page/AnnotationLayer.css';
// import 'react-pdf/dist/Page/TextLayer.css';

// SSR-safe dynamic imports
const Document: any = dynamic(
  () => import("react-pdf").then((m) => m.Document),
  { ssr: false }
);
const Page: any = dynamic(() => import("react-pdf").then((m) => m.Page), {
  ssr: false,
});

interface PdfRendererProps {
  url: string; // Tigris public URL
}

export default function PdfRenderer({ url }: PdfRendererProps) {
  
  const { toast } = useToast();
  const [numPages, setNumPages] = useState<number>();
  const [currPage, setCurrPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [renderedScale, setRenderedScale] = useState<number | null>(null);
  const isLoading = renderedScale !== scale;
  useEffect(() => {
    initPdfWorker();   // runs only in the browser
  }, []);

  const PageSchema = z.object({
    page: z.string().refine((n) => {
      const v = Number(n);
      return v > 0 && v <= (numPages ?? 1);
    }),
  });
  type PageForm = z.infer<typeof PageSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PageForm>({
    defaultValues: { page: "1" },
    resolver: zodResolver(PageSchema),
  });

  const { width, ref } = useResizeDetector();

  const file = useMemo(() => ({ url, withCredentials: false }), [url]);

  const goTo = (n: number) => {
    const clamped = Math.max(1, Math.min(n, numPages ?? n));
    setCurrPage(clamped);
    setValue("page", String(clamped));
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-md shadow flex flex-col items-center">
      {/* Toolbar */}
      <div className="h-14 w-full border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            aria-label="previous page"
            disabled={currPage <= 1}
            onClick={() => goTo(currPage - 1)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            <Input
              {...register("page")}
              className={cn(
                "w-12 h-8",
                errors.page && "focus-visible:ring-red-500"
              )}
              onKeyDown={(e) =>
                e.key === "Enter" && handleSubmit(({ page }) => goTo(+page))()
              }
            />
            <p className="text-zinc-700 dark:text-zinc-300 text-sm space-x-1">
              <span>/</span>
              <span>{numPages ?? "x"}</span>
            </p>
          </div>

          <Button
            variant="ghost"
            aria-label="next page"
            disabled={!numPages || currPage === numPages}
            onClick={() => goTo(currPage + 1)}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-1.5" variant="ghost" aria-label="zoom">
                <Search className="h-4 w-4" />
                {Math.round(scale * 100)}%
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {[1, 1.5, 2, 2.5].map((s) => (
                <DropdownMenuItem key={s} onSelect={() => setScale(s)}>
                  {s * 100}%
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            aria-label="rotate"
            onClick={() => setRotation((r) => r + 90)}
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <PdfFullscreen fileUrl={url} />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 w-full max-h-screen">
        <SimpleBar autoHide={false} className="max-h-[calc(100vh-10rem)]">
          <div ref={ref}>
            <Document
              file={file}
              //@ts-ignore
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              //@ts-ignore
              onLoadError={(err) =>
                toast({
                  title: "Error loading PDF",
                  description:
                    (err as Error)?.message ?? "Please try again later",
                  variant: "destructive",
                })
              }
              loading={
                <div className="flex justify-center">
                  <Loader2 className="my-24 h-6 w-6 animate-spin" />
                </div>
              }
              className="max-h-full"
            >
              {/* Optional “pre-render” to avoid flicker while zooming */}
              {isLoading && renderedScale ? (
                <Page
                  key={"@" + renderedScale}
                  width={width || 1}
                  pageNumber={currPage}
                  scale={scale}
                  rotate={rotation}
                  // Toggle these if you don't need selectable text/links:
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              ) : null}

              <Page
                key={"@" + scale}
                className={cn(isLoading ? "hidden" : "")}
                width={width || 1}
                pageNumber={currPage}
                scale={scale}
                rotate={rotation}
                onRenderSuccess={() => setRenderedScale(scale)}
                loading={
                  <div className="flex justify-center">
                    <Loader2 className="my-24 h-6 w-6 animate-spin" />
                  </div>
                }
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        </SimpleBar>
      </div>
    </div>
  );
}
