"use client";

import { useEffect, useMemo, useState } from "react";
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
import FlashcardsModal from "./FlashcardsModal";
import { Separator } from "@/components/ui/separator";
import { Loader2, History as HistoryIcon } from "lucide-react";

/* =========================
   Simple SWR-style cache
   ========================= */
type FlashcardSetLite = {
  id: string;
  createdAt: string;
  count: number;
  difficulty: string;
  language: string;
  itemsCount: number;
};
type HistoryCacheEntry = { sets: FlashcardSetLite[]; ts: number };
type SetDetail = { id: string; createdAt: string; cards: Flashcard[] };
type SetCacheEntry = { data: SetDetail; ts: number };

const MEM_HISTORY = new Map<string, HistoryCacheEntry>(); // key: chatId
const MEM_SET = new Map<string, SetCacheEntry>(); // key: setId

const TTL_MS = 5 * 60 * 1000; // 5 minutes

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

async function fetchHistory(chatId: string): Promise<FlashcardSetLite[]> {
  const res = await fetch(
    `/api/flashcards/history?chatId=${encodeURIComponent(chatId)}`
  );
  if (!res.ok) throw new Error("history fetch failed");
  const data = await res.json();
  return data.sets ?? [];
}
async function fetchSet(setId: string): Promise<SetDetail> {
  const res = await fetch(`/api/flashcards/set/${setId}`);
  if (!res.ok) throw new Error("set fetch failed");
  return await res.json();
}

/* ========================= */

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  hint?: string;
  difficulty?: "easy" | "normal" | "hard";
};

export default function FlashcardsPanel({ chatId }: { chatId: string }) {
  const [count, setCount] = useState(12);
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">(
    "normal"
  );
  const [language, setLanguage] = useState("fr");
  const [loading, setLoading] = useState(false);

  // modal
  const [open, setOpen] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);

  // history
  const [sets, setSets] = useState<FlashcardSetLite[]>([]);
  const [loadingHist, setLoadingHist] = useState(true);

  /* -------- Load history with cache (SWR) -------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingHist(true);

      const lsKey = `fc_hist_${chatId}`;
      const mem = MEM_HISTORY.get(chatId);
      const ls = readLS<HistoryCacheEntry>(lsKey);

      // 1) serve fastest cache first (mem, else localStorage)
      if (mem && isFresh(mem.ts)) {
        setSets(mem.sets);
        setLoadingHist(false);
      } else if (ls && isFresh(ls.ts)) {
        setSets(ls.sets);
        setLoadingHist(false);
        MEM_HISTORY.set(chatId, ls);
      }

      // 2) revalidate in background
      try {
        const remote = await fetchHistory(chatId);
        if (!alive) return;
        setSets(remote);
        const entry: HistoryCacheEntry = { sets: remote, ts: Date.now() };
        MEM_HISTORY.set(chatId, entry);
        writeLS(lsKey, entry);
      } catch {
        // ignore; if we had cache we already showed it
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
      const res = await fetch("/api/flashcards", {
        method: "POST",
        body: JSON.stringify({ chatId, count, difficulty, language }),
      });
      if (!res.ok) throw new Error("Flashcard generation failed");
      const data = await res.json();

      // show freshly generated cards
      setCards(
        (data.cards ?? []).map((c: any) => ({
          id: c.id ?? crypto.randomUUID(),
          front: c.front,
          back: c.back,
          hint: c.hint,
        }))
      );
      setOpen(true);

      // refresh history → write caches
      const remote = await fetchHistory(chatId);
      setSets(remote);
      const entry: HistoryCacheEntry = { sets: remote, ts: Date.now() };
      MEM_HISTORY.set(chatId, entry);
      writeLS(`fc_hist_${chatId}`, entry);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  /* -------- Open a set with per-set cache -------- */
  async function openSet(setId: string) {
    const lsKey = `fc_set_${setId}`;
    const mem = MEM_SET.get(setId);
    const ls = readLS<SetCacheEntry>(lsKey);

    // 1) show cached set immediately if fresh
    if (mem && isFresh(mem.ts)) {
      setCards(mem.data.cards);
      setOpen(true);
      // still revalidate in bg
      try {
        const fresh = await fetchSet(setId);
        setCards(fresh.cards);
        setOpen(true);
        const entry: SetCacheEntry = { data: fresh, ts: Date.now() };
        MEM_SET.set(setId, entry);
        writeLS(lsKey, entry);
      } catch {}
      return;
    } else if (ls && isFresh(ls.ts)) {
      setCards(ls.data.cards);
      setOpen(true);
      MEM_SET.set(setId, ls);
      // bg revalidate
      try {
        const fresh = await fetchSet(setId);
        setCards(fresh.cards);
        setOpen(true);
        const entry: SetCacheEntry = { data: fresh, ts: Date.now() };
        MEM_SET.set(setId, entry);
        writeLS(lsKey, entry);
      } catch {}
      return;
    }

    // 2) no fresh cache → fetch then cache
    try {
      const fresh = await fetchSet(setId);
      setCards(fresh.cards);
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
          <CardTitle className="text-base">Flashcards</CardTitle>
          <CardDescription>
            Generate spaced-repetition style cards from your PDF (front/back).
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Controls */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="min-w-0">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Cards
              </label>
              <Select
                value={String(count)}
                onValueChange={(v) => setCount(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[8, 12, 16, 20, 24].map((n) => (
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

            <div className="min-w-0">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Language
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCards([])}
              disabled={loading || cards.length === 0}
            >
              Clear
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating..." : "Generate Flashcards"}
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
              No flashcards yet for this chat.
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
                          {s.itemsCount} cards • {s.difficulty} •{" "}
                          {s.language.toUpperCase()}
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

      <FlashcardsModal open={open} onOpenChange={setOpen} cards={cards} />
    </>
  );
}
