// components/flashcards/FlashcardsPanel.tsx
"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);

  async function handleGenerate() {
    try {
      setLoading(true);
      const res = await fetch("/api/flashcards", {
        method: "POST",
        body: JSON.stringify({ chatId, count, difficulty, language }),
      });
      if (!res.ok) throw new Error("Flashcard generation failed");
      const data = await res.json();
      setCards(data.cards ?? []);
      setOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
          {/* Responsive, full-width controls */}
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
                onValueChange={(v) =>
                  setDifficulty(v as "easy" | "normal" | "hard")
                }
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
        </CardContent>

        <CardFooter className="pt-0 flex items-center justify-end gap-2">
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
        </CardFooter>
      </Card>

      <FlashcardsModal open={open} onOpenChange={setOpen} cards={cards} />
    </>
  );
}
