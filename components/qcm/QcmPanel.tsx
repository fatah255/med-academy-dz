// components/qcm/QcmPanel.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  console.log(questions);
  return (
    <>
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold text-lg">QCM Generation</h3>
        <p className="text-sm text-muted-foreground">
          Generate multiple-choice questions from your PDF.
        </p>

        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Number of Questions
            </label>
            <select
              className="w-28 rounded-md border bg-background px-3 py-2"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Difficulty</label>
            <select
              className="w-36 rounded-md border bg-background px-3 py-2"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "easy" | "normal" | "hard")
              }
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <Button className="mt-6" onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate QCM"}
        </Button>
      </div>

      <QcmModal
        open={open}
        onOpenChange={setOpen}
        questions={questions ?? []}
      />
    </>
  );
}
