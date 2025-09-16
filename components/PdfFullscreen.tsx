"use client";
// import "@/lib/setup-pdf-worker";

import { useMemo, useState, useEffect } from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css"; // ✅ IMPORTANT
import { useResizeDetector } from "react-resize-detector";
import { initPdfWorker } from "@/lib/setup-pdf-worker";
import { Expand, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "./ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import dynamic from "next/dynamic";
const Document: any = dynamic(
  () => import("react-pdf").then((m) => m.Document),
  { ssr: false }
);
const Page: any = dynamic(() => import("react-pdf").then((m) => m.Page), {
  ssr: false,
});

interface PdfFullscreenProps {
  fileUrl: string;
}

export default function PdfFullscreen({ fileUrl }: PdfFullscreenProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [numPages, setNumPages] = useState<number>();
  const { width, ref } = useResizeDetector();
  const { toast } = useToast();

  useEffect(() => {
    initPdfWorker(); // runs only in the browser
  }, []);

  const file = useMemo(
    () => ({ url: fileUrl, withCredentials: false }),
    [fileUrl]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-1.5" aria-label="fullscreen">
          <Expand className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[96vw] max-w-7xl p-4">
        <VisuallyHidden>
          <DialogTitle>PDF viewer</DialogTitle>
        </VisuallyHidden>

        {/* Give the scroll viewport a definite height */}
        <div className="mt-2 h-[calc(100vh-12rem)] overflow-hidden">
          <SimpleBar autoHide={false} style={{ height: "100%" }}>
            <div ref={ref} className="pb-6">
              <Document
                file={file}
                // @ts-ignore
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                // @ts-ignore
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
              >
                {Array.from({ length: numPages ?? 0 }, (_, i) => (
                  <Page
                    key={i}
                    width={width || 1}
                    pageNumber={i + 1}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                ))}
              </Document>
            </div>
          </SimpleBar>
        </div>
      </DialogContent>
    </Dialog>
  );
}
