"use client";

export function PdfViewer({
  src,
  title,
  height = 560, // adjust if you want taller/shorter previews
}: {
  src: string;
  title?: string;
  height?: number;
}) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-muted bg-muted/20">
      <iframe
        src={`${src}#toolbar=1&navpanes=0&scrollbar=1`}
        title={title ?? "PDF preview"}
        className="w-full"
        style={{ height }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
