"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QcmModal from "./QcmModal";
import { Separator } from "@/components/ui/separator";
import { Loader2, History as HistoryIcon } from "lucide-react";

export type QcmItem = {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
};

/* =========================
   Simple SWR-style cache
   ========================= */
type QcmSetLite = {
  id: string;
  createdAt: string;
  count: number;
  difficulty: string;
  itemsCount: number;
};
type HistoryCacheEntry = { sets: QcmSetLite[]; ts: number };
type SetDetail = { id: string; createdAt: string; questions: QcmItem[] };
type SetCacheEntry = { data: SetDetail; ts: number };

const MEM_HISTORY = new Map<string, HistoryCacheEntry>(); // key: chatId
const MEM_SET = new Map<string, SetCacheEntry>(); // key: setId
const TTL_MS = 5 * 60 * 1000;

function readLS<T>(key: string): T | null {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}
function writeLS(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}
function isFresh(ts: number, ttl = TTL_MS) {
  return Date.now() - ts < ttl;
}

async function fetchHistory(chatId: string): Promise<QcmSetLite[]> {
  const res = await fetch(
    `/api/qcm/history?chatId=${encodeURIComponent(chatId)}`
  );
  if (!res.ok) throw new Error("history fetch failed");
  const data = await res.json();
  return data.sets ?? [];
}
async function fetchSet(setId: string): Promise<SetDetail> {
  const res = await fetch(`/api/qcm/set/${setId}`);
  if (!res.ok) throw new Error("set fetch failed");
  return await res.json();
}

/* ========================= */

export default function QcmPanel({ chatId }: { chatId: string }) {
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">(
    "normal"
  );
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<QcmItem[] | null>(null);

  // history
  const [sets, setSets] = useState<QcmSetLite[]>([]);
  const [loadingHist, setLoadingHist] = useState(true);

  /* -------- Load history with cache (SWR) -------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingHist(true);

      const lsKey = `qcm_hist_${chatId}`;
      const mem = MEM_HISTORY.get(chatId);
      const ls = readLS<HistoryCacheEntry>(lsKey);

      // 1) serve cached first
      if (mem && isFresh(mem.ts)) {
        setSets(mem.sets);
        setLoadingHist(false);
      } else if (ls && isFresh(ls.ts)) {
        setSets(ls.sets);
        setLoadingHist(false);
        MEM_HISTORY.set(chatId, ls);
      }

      // 2) revalidate in bg
      try {
        const remote = await fetchHistory(chatId);
        if (!alive) return;
        setSets(remote);
        const entry: HistoryCacheEntry = { sets: remote, ts: Date.now() };
        MEM_HISTORY.set(chatId, entry);
        writeLS(lsKey, entry);
      } catch {
        // ignore
      } finally {
        if (alive) setLoadingHist(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [chatId]);

  /* -------- Generate then refresh + update cache -------- */
  async function handleGenerate() {
    try {
      setLoading(true);
      const res = await fetch("/api/qcm", {
        method: "POST",
        body: JSON.stringify({ chatId, count, difficulty }),
      });
      if (!res.ok) throw new Error("QCM generation failed");
      const data = await res.json();

      setQuestions(data.questions ?? []);
      setOpen(true);

      // refresh history
      const remote = await fetchHistory(chatId);
      setSets(remote);
      const entry: HistoryCacheEntry = { sets: remote, ts: Date.now() };
      MEM_HISTORY.set(chatId, entry);
      writeLS(`qcm_hist_${chatId}`, entry);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  /* -------- Open a saved set (cached) -------- */
  async function openSet(setId: string) {
    const lsKey = `qcm_set_${setId}`;
    const mem = MEM_SET.get(setId);
    const ls = readLS<SetCacheEntry>(lsKey);

    // show cached immediately if fresh, then bg refresh
    if (mem && isFresh(mem.ts)) {
      setQuestions(mem.data.questions);
      setOpen(true);
      try {
        const fresh = await fetchSet(setId);
        setQuestions(fresh.questions);
        setOpen(true);
        const entry: SetCacheEntry = { data: fresh, ts: Date.now() };
        MEM_SET.set(setId, entry);
        writeLS(lsKey, entry);
      } catch {}
      return;
    } else if (ls && isFresh(ls.ts)) {
      setQuestions(ls.data.questions);
      setOpen(true);
      MEM_SET.set(setId, ls);
      try {
        const fresh = await fetchSet(setId);
        setQuestions(fresh.questions);
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
      setQuestions(fresh.questions);
      setOpen(true);
      const entry: SetCacheEntry = { data: fresh, ts: Date.now() };
      MEM_SET.set(setId, entry);
      writeLS(lsKey, entry);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <>
      <Card className="sticky top-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">QCM Generation</CardTitle>
          <CardDescription>
            Generate multiple-choice questions from your PDF.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Number of Questions
              </label>
              <Select
                value={String(count)}
                onValueChange={(v) => setCount(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Difficulty
              </label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuestions(null)}
              disabled={loading || !questions?.length}
            >
              Clear
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating..." : "Generate QCM"}
            </Button>
          </div>

          <Separator className="my-4" />

          {/* History */}
          <div className="flex items-center gap-2 mb-2">
            <HistoryIcon className="h-4 w-4" />
            <p className="text-sm font-medium">History</p>
            {loadingHist && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {sets.length === 0 && !loadingHist ? (
            <p className="text-sm text-muted-foreground">
              No QCM sets yet for this chat.
            </p>
          ) : (
            <ul className="space-y-2">
              {sets.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => openSet(s.id)}
                    className="w-full text-left rounded-md border bg-card/50 hover:bg-accent/50 px-3 py-2 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {new Date(s.createdAt).toLocaleString()}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.itemsCount} questions • {s.difficulty}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground cursor-pointer">
                        Open
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <QcmModal
        open={open}
        onOpenChange={setOpen}
        questions={questions ?? []}
      />
    </>
  );
}
