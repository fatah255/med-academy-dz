// components/file-uploader/MuxUploader.tsx
"use client";

import * as React from "react";

type Props = {
  value?: string | null; // current playbackId (if any)
  onChange: (playbackId: string | null) => void;
  label?: string;
};

export default function MuxUploader({ value, onChange, label }: Props) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadId, setUploadId] = React.useState<string | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);

  async function pick() {
    setError(null);
    inputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setProgress(0);

      // 1) Ask server to create direct upload
      const startRes = await fetch("/api/mux/direct-upload", {
        method: "POST",
      });
      const startJson = await startRes.json();
      if (!startRes.ok) throw new Error(startJson?.error || "Mux init failed");

      const { id, url } = startJson as { id: string; url: string };
      setUploadId(id);

      // 2) PUT file to URL (XHR to track progress)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.setRequestHeader(
          "Content-Type",
          file.type || "application/octet-stream"
        );

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setProgress(pct);
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };

        xhr.send(file);
      });

      // 3) Poll upload -> asset -> playbackId
      const playbackId = await pollForPlaybackId(id);
      onChange(playbackId);
    } catch (err: any) {
      setError(err?.message || "Upload failed");
      onChange(null);
    } finally {
      setUploading(false);
      setProgress(null);
      // clear input so user can reselect the same file
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function pollForPlaybackId(id: string) {
    const started = Date.now();
    const timeoutMs = 5 * 60 * 1000; // 5 min max
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    while (true) {
      const res = await fetch(`/api/mux/uploads/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Mux status failed");

      if (json.ready && json.playbackId) return json.playbackId;

      // display a tiny status
      if (json.status === "errored") {
        throw new Error("Mux processing error");
      }

      if (Date.now() - started > timeoutMs) {
        throw new Error("Mux processing timeout");
      }

      await delay(1500);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label ?? "Lesson Video (Mux)"}
      </label>

      {value ? (
        <div className="rounded border p-3 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Mux playback ID</div>
              <div className="text-muted-foreground">{value}</div>
            </div>
            <button
              type="button"
              className="text-xs underline"
              onClick={() => onChange(null)}
            >
              Replace video
            </button>
          </div>
          {/* If you installed @mux/mux-player-react, you could preview here.
             For now we just show the id. */}
        </div>
      ) : (
        <div className="rounded border p-4">
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={handleFileSelected}
          />
          <button
            type="button"
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
            onClick={pick}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Choose a video"}
          </button>

          {progress !== null && (
            <div className="mt-3">
              <div className="mb-1 text-xs text-muted-foreground">
                Uploading {progress}% {uploadId ? `· ${uploadId}` : ""}
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-muted">
                <div
                  className="h-2 bg-primary transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
        </div>
      )}
    </div>
  );
}
