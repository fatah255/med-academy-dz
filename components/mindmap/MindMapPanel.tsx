"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, History as HistoryIcon } from "lucide-react";

const MindMapCanvas = dynamic(() => import("./MindMapCanvas"), { ssr: false });

type Mode = "resumed" | "detailed";
type MindMapDoc = { topic: string; markdown: string };

// ---- history types + tiny cache (SWR style) ----
type MindmapLite = {
  id: string;
  createdAt: string;
  mode: string;
  topic: string;
};
type HistoryCacheEntry = { sets: MindmapLite[]; ts: number };
type SetDetail = { id: string; createdAt: string; doc: MindMapDoc };
type SetCacheEntry = { data: SetDetail; ts: number };

const MEM_HIST = new Map<string, HistoryCacheEntry>(); // key: chatId
const MEM_SET = new Map<string, SetCacheEntry>(); // key: setId
const TTL_MS = 5 * 60 * 1000;

function readLS<T>(k: string): T | null {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function writeLS(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}
function isFresh(ts: number) {
  return Date.now() - ts < TTL_MS;
}

async function fetchHistory(chatId: string): Promise<MindmapLite[]> {
  const r = await fetch(
    `/api/mindmap/history?chatId=${encodeURIComponent(chatId)}`
  );
  if (!r.ok) throw new Error("history fetch failed");
  const j = await r.json();
  return j.sets ?? [];
}
async function fetchSet(setId: string): Promise<SetDetail> {
  const r = await fetch(`/api/mindmap/set/${setId}`);
  if (!r.ok) throw new Error("set fetch failed");
  return await r.json();
}

export default function MindMapPanel({ chatId }: { chatId: string }) {
  const [mode, setMode] = useState<Mode>("resumed");
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState<MindMapDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // history state
  const [sets, setSets] = useState<MindmapLite[]>([]);
  const [loadingHist, setLoadingHist] = useState(true);

  // load history with cache (SWR-like)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingHist(true);

      const lsKey = `mm_hist_${chatId}`;
      const mem = MEM_HIST.get(chatId);
      const ls = readLS<HistoryCacheEntry>(lsKey);

      // serve cache first
      if (mem && isFresh(mem.ts)) {
        setSets(mem.sets);
        setLoadingHist(false);
      } else if (ls && isFresh(ls.ts)) {
        setSets(ls.sets);
        setLoadingHist(false);
        MEM_HIST.set(chatId, ls);
      }

      // revalidate in background
      try {
        const remote = await fetchHistory(chatId);
        if (!alive) return;
        setSets(remote);
        const entry: HistoryCacheEntry = { sets: remote, ts: Date.now() };
        MEM_HIST.set(chatId, entry);
        writeLS(lsKey, entry);
      } catch {
        // ignore — user already saw cache if available
      } finally {
        if (alive) setLoadingHist(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [chatId]);

  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/mindmap", {
        method: "POST",
        body: JSON.stringify({ chatId, mode }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || json?.error || "Failed to generate");
      setDoc(json.doc ?? json);

      // refresh history + cache
      const remote = await fetchHistory(chatId);
      setSets(remote);
      const entry: HistoryCacheEntry = { sets: remote, ts: Date.now() };
      MEM_HIST.set(chatId, entry);
      writeLS(`mm_hist_${chatId}`, entry);
    } catch (e: any) {
      setError(String(e.message ?? e));
      setDoc(null);
    } finally {
      setLoading(false);
    }
  }

  async function openSet(setId: string) {
    const lsKey = `mm_set_${setId}`;
    const mem = MEM_SET.get(setId);
    const ls = readLS<SetCacheEntry>(lsKey);

    // show cached immediately, then background refresh
    if (mem && isFresh(mem.ts)) {
      setDoc(mem.data.doc);
      setOpen(true);
      try {
        const fresh = await fetchSet(setId);
        setDoc(fresh.doc);
        setOpen(true);
        const entry: SetCacheEntry = { data: fresh, ts: Date.now() };
        MEM_SET.set(setId, entry);
        writeLS(lsKey, entry);
      } catch {}
      return;
    } else if (ls && isFresh(ls.ts)) {
      setDoc(ls.data.doc);
      setOpen(true);
      MEM_SET.set(setId, ls);
      try {
        const fresh = await fetchSet(setId);
        setDoc(fresh.doc);
        setOpen(true);
        const entry: SetCacheEntry = { data: fresh, ts: Date.now() };
        MEM_SET.set(setId, entry);
        writeLS(lsKey, entry);
      } catch {}
      return;
    }

    // no fresh cache → fetch
    try {
      const fresh = await fetchSet(setId);
      setDoc(fresh.doc);
      setOpen(true);
      const entry: SetCacheEntry = { data: fresh, ts: Date.now() };
      MEM_SET.set(setId, entry);
      writeLS(lsKey, entry);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-1 text-lg font-semibold">
        Mind Map (Markdown / Markmap)
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Generates Mapify-style Markdown (using <code>#</code> levels) and
        renders it as a curved mind map.
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
          disabled={!doc}
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
        {doc ? (
          <MindMapCanvas markdown={doc.markdown} height={540} />
        ) : (
          <div className="grid h-[540px] place-items-center rounded-md border bg-muted/10 text-sm text-muted-foreground">
            Your mind map will appear here.
          </div>
        )}
      </div>

      <Separator className="my-4" />

      {/* History */}
      <div className="mb-2 flex items-center gap-2">
        <HistoryIcon className="h-4 w-4" />
        <p className="text-sm font-medium">History</p>
        {loadingHist && (
          <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {sets.length === 0 && !loadingHist ? (
        <p className="text-sm text-muted-foreground">
          No mind maps yet for this chat.
        </p>
      ) : (
        <ul className="space-y-2">
          {sets.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => openSet(s.id)}
                className="w-full text-left rounded-md border bg-card/50 px-3 py-2 transition hover:bg-accent/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.topic}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString()} • {s.mode}
                    </p>
                  </div>
                  <span className="cursor-pointer text-xs text-muted-foreground">
                    Open
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[96vw] max-w-[1200px] p-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle>{doc?.topic ?? "Mind Map"}</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4">
            {doc && <MindMapCanvas markdown={doc.markdown} height="72vh" />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
