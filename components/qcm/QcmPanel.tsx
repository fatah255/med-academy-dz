// components/qcm/QcmPanel.tsx
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
import QcmModal from "./QcmModal";

export type QcmItem = {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
};

export default function QcmPanel({ chatId }: { chatId: string }) {
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">(
    "normal"
  );
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<QcmItem[] | null>(null);

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
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex items-center justify-end gap-2">
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
        </CardFooter>
      </Card>

      <QcmModal
        open={open}
        onOpenChange={setOpen}
        questions={questions ?? []}
      />
    </>
  );
}
