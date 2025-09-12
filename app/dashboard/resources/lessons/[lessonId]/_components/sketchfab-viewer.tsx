"use client";

// Extract the model ID from common Sketchfab URLs
function extractSketchfabId(input: string): string | null {
  if (!input) return null;
  // already an /embed URL -> pull the id out
  let m = input.match(/sketchfab\.com\/models\/([0-9a-f]{32})\/?embed/i);
  if (m?.[1]) return m[1];

  // plain /models/<id>
  m = input.match(/sketchfab\.com\/models\/([0-9a-f]{32})/i);
  if (m?.[1]) return m[1];

  // /3d-models/<slug>-<id>
  m = input.match(/sketchfab\.com\/3d-models\/[^/]*-([0-9a-f]{32})/i);
  if (m?.[1]) return m[1];

  return null;
}

function toEmbedUrl(
  input: string,
  opts?: {
    autostart?: boolean;
    uiInfos?: 0 | 1;
    uiWatermark?: 0 | 1;
    uiStop?: 0 | 1;
    uiSnapshots?: 0 | 1;
  }
) {
  const id = extractSketchfabId(input);
  if (!id) return null;
  const q = new URLSearchParams({
    autostart: (opts?.autostart ? 1 : 0).toString(),
    internal: "1",
    tracking: "0",
    ui_infos: String(opts?.uiInfos ?? 0),
    ui_snapshots: String(opts?.uiSnapshots ?? 1),
    ui_stop: String(opts?.uiStop ?? 0),
    ui_watermark: String(opts?.uiWatermark ?? 0),
  });
  return `https://sketchfab.com/models/${id}/embed?${q.toString()}`;
}

export function SketchfabViewer({
  url,
  title,
  className,
  height = 560, // adjust as needed
}: {
  url: string;
  title?: string;
  className?: string;
  height?: number;
}) {
  const embed = toEmbedUrl(url, { autostart: false });

  // fallback: if not a Sketchfab URL, just show a link
  if (!embed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-primary hover:underline underline-offset-4"
      >
        Open model
      </a>
    );
  }

  return (
    <div
      className={`w-full overflow-hidden rounded-lg border border-muted bg-muted/20 ${
        className ?? ""
      }`}
      style={{ height }}
    >
      <iframe
        title={title ?? "3D model"}
        src={embed}
        className="h-full w-full"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        referrerPolicy="no-referrer"
        allowFullScreen
      />
    </div>
  );
}
