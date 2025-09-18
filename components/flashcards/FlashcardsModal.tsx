// components/flashcards/FlashcardsModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import { Flashcard } from "./FlashcardsPanel";

export default function FlashcardsModal({
  open,
  onOpenChange,
  cards,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cards: Flashcard[];
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!open) {
      setIdx(0);
      setFlipped(false);
    }
  }, [open]);

  const card = cards[idx];

  const next = () => {
    setIdx((i) => Math.min(cards.length - 1, i + 1));
    setFlipped(false);
  };
  const prev = () => {
    setIdx((i) => Math.max(0, i - 1));
    setFlipped(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key.toLowerCase() === "f" || e.key === " ") setFlipped((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const progress = useMemo(
    () => (cards.length ? Math.round(((idx + 1) / cards.length) * 100) : 0),
    [idx, cards.length]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden [&>button[aria-label='Close']]:hidden">
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <div className="text-sm text-muted-foreground">
            {idx + 1} / {cards.length} — {progress}%
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={prev}
              disabled={idx === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFlipped((v) => !v)}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={next}
              disabled={idx === cards.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>
        </div>

        <div className="p-6">
          {card ? (
            <div className="mx-auto perspective-1000 w-full max-w-2xl">
              <motion.div
                className="relative h-72 w-full cursor-pointer select-none"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                onClick={() => setFlipped((v) => !v)}
              >
                {/* FRONT */}
                <div className="absolute inset-0 rounded-2xl border bg-card shadow-sm backface-hidden">
                  <div className="flex h-full w-full items-center justify-center px-6 text-center">
                    <p className="text-xl sm:text-2xl font-semibold leading-snug tracking-tight text-foreground">
                      {card.front}
                    </p>
                  </div>
                  {card.hint ? (
                    <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1 text-xs text-muted-foreground bg-background/70 backdrop-blur">
                      Hint: {card.hint}
                    </div>
                  ) : null}
                </div>

                {/* BACK */}
                <div
                  className="absolute inset-0 rounded-2xl border bg-card shadow-sm backface-hidden"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <div className="flex h-full w-full items-center justify-center px-6 text-center">
                    <p className="text-xl sm:text-2xl font-semibold leading-snug tracking-tight text-foreground">
                      {card.back}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              No cards.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
