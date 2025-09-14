"use client";
import dynamic from "next/dynamic";
const PdfRenderer = dynamic(() => import("@/components/PdfRenderer"), {
  ssr: false, // ⬅️ critical: prevents pdfjs from running on the server
});

export function ClientPdfRenderer({ url }: { url: string }) {
  return <PdfRenderer url={url} />;
}
