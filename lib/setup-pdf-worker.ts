"use client";

import { pdfjs } from "react-pdf";

// Use a real module worker if possible, otherwise fall back to workerSrc.
// IMPORTANT: Only reference the ESM path (.mjs) so the bundler can resolve it.
try {
  (pdfjs as any).GlobalWorkerOptions.workerPort = new Worker(
    new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
    { type: "module" }
  );
} catch {
  (pdfjs as any).GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}
