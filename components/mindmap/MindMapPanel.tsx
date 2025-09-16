"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MindMapCanvas = dynamic(() => import("./MindMapCanvas"), { ssr: false });

type Mode = "resumed" | "detailed";
type MindNode = { title: string; note?: string; children?: MindNode[] };
type MindMap = { title: string; children?: MindNode[] };

export default function MindMapPanel({ chatId }: { chatId: string }) {
  const [mode, setMode] = useState<Mode>("resumed");
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState<MindMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/mindmap", {
        method: "POST",
        body: JSON.stringify({ chatId, mode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to generate");
      setMap(json.mindmap ?? json);
    } catch (e: any) {
      setError(String(e.message ?? e));
      setMap(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-1 text-lg font-semibold">Mind Map Generation</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Generate a **mind-map layout** (root left, curved branches to the
        right).
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Mind Map"}
        </Button>

        <select
          className="ml-2 rounded-md border bg-background px-3 py-2 text-sm"
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
        >
          <option value="resumed">resumed (recommended)</option>
          <option value="detailed">detailed</option>
        </select>

        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          disabled={!map}
          className="ml-auto"
        >
          Expand
        </Button>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-600/30 bg-red-600/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-2">
        {map ? (
          <MindMapCanvas data={map} height={540} />
        ) : (
          <div className="grid h-[540px] place-items-center rounded-md border bg-muted/10 text-sm text-muted-foreground">
            Your mind map will appear here.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[96vw] max-w-[1200px] p-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle>{map?.title ?? "Mind Map"}</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4">
            {map && <MindMapCanvas data={map} height="72vh" />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
