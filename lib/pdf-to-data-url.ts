// lib/pdf-to-data-url.ts
export async function pdfToDataUrlFromUrl(url: string): Promise<string> {
  // If your storage needs auth, replace fetch with your SDK to read bytes.
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`PDF fetch failed: ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:application/pdf;base64,${buf.toString("base64")}`;
}
