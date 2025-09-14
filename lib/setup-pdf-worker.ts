// "use client";

// import { pdfjs } from "react-pdf";

// // Use a real module worker if possible, otherwise fall back to workerSrc.
// // IMPORTANT: Only reference the ESM path (.mjs) so the bundler can resolve it.
// try {
//   (pdfjs as any).GlobalWorkerOptions.workerPort = new Worker(
//     new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
//     { type: "module" }
//   );
// } catch {
//   (pdfjs as any).GlobalWorkerOptions.workerSrc = new URL(
//     "pdfjs-dist/build/pdf.worker.min.mjs",
//     import.meta.url
//   ).toString();
// }
// lib/setup-pdf-worker.ts
"use client";

/** Call this inside a useEffect in client components. */
export async function initPdfWorker() {
  // guard for SSR
  if (typeof window === "undefined") return;

  // Lazy import so we don't touch pdfjs while rendering on the server
  const { pdfjs } = await import("react-pdf");

  // Use a CDN worker (simple & reliable)
  (
    pdfjs as any
  ).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}
