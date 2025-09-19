// components/qcm/QcmPlayer.tsx
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight, RotateCcw } from "lucide-react";

/** Original (simple) shape you used elsewhere */
export type QcmItem = {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number; // 0-based
  explanation?: string;
};

/** API shape you showed: choices are objects with text/correct */
type ApiChoice = { id?: string; text: string; correct?: boolean };
type ApiItem = {
  id?: string;
  question?: string;
  choices?: Array<ApiChoice | string>;
  explanation?: string;
  correctIndex?: number; // sometimes present
};

/** What the player actually uses after normalization */
type Normalized = {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
};

function letter(n: number) {
  return String.fromCharCode("A".charCodeAt(0) + n);
}

/** Normalize ANY incoming shape into {choices:string[], correctIndex:number} */
function normalizeQuestions(
  input: Array<QcmItem | ApiItem> = []
): Normalized[] {
  return input.map((q, i) => {
    const id = String((q as any).id ?? i);
    const question = (q as any).question ?? (q as any).text ?? "";

    const rawChoices = (q as any).choices ?? [];
    let choices: string[] = [];
    let correctIndex = 0;

    if (Array.isArray(rawChoices) && rawChoices.length > 0) {
      if (typeof rawChoices[0] === "string") {
        choices = rawChoices as string[];
        correctIndex =
          typeof (q as any).correctIndex === "number"
            ? (q as any).correctIndex
            : 0;
      } else {
        const arr = rawChoices as ApiChoice[];
        choices = arr.map((c) => c?.text ?? "");
        const idx = arr.findIndex((c) => c?.correct === true);
        correctIndex =
          typeof (q as any).correctIndex === "number"
            ? (q as any).correctIndex
            : idx >= 0
            ? idx
            : 0;
      }
    }

    const explanation =
      (q as any).explanation ?? (q as any).reason ?? (q as any).comment ?? "";

    return { id, question, choices, correctIndex, explanation };
  });
}

export default function QcmPlayer({
  questions,
  onClose,
}: {
  questions: Array<QcmItem | ApiItem>;
  onClose: () => void;
}) {
  // Normalize once
  const list = useMemo(() => normalizeQuestions(questions), [questions]);

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);
  const [score, setScore] = useState(0);

  if (!Array.isArray(list) || list.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No questions returned.
      </div>
    );
  }

  const q = list[i];
  const finished = i === list.length - 1 && verified;

  const onVerify = () => {
    if (picked == null) return;
    setVerified(true);
    if (picked === q.correctIndex) setScore((s) => s + 1);
  };

  const onNext = () => {
    if (i === list.length - 1) return;
    setI((v) => v + 1);
    setPicked(null);
    setVerified(false);
  };

  const onRestart = () => {
    setI(0);
    setPicked(null);
    setVerified(false);
    setScore(0);
  };

  return (
    <div className="space-y-4">
      {/* header / progress */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Question <span className="font-medium">{i + 1}</span> / {list.length}
        </div>
        <div className="text-sm">
          Score: <span className="font-medium">{score}</span> / {list.length}
        </div>
      </div>

      {/* question card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Q{i + 1}</CardTitle>
          <CardDescription className="text-base break-words whitespace-pre-wrap hyphens-auto">
            {q.question}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* choices */}
      <div className="space-y-3">
        {q.choices.map((choice, idx) => {
          const selected = picked === idx;
          const correct = verified && idx === q.correctIndex;
          const wrong = verified && selected && idx !== q.correctIndex;

          return (
            <Button
              key={idx}
              variant={selected && !verified ? undefined : "outline"}
              className={cn(
                // allow wrapping & growth
                "w-full h-auto justify-start px-3 py-4 text-left whitespace-normal",
                correct && "border-green-500 bg-green-500/10 text-green-600",
                wrong && "border-red-500 bg-red-500/10 text-red-600"
              )}
              onClick={() => !verified && setPicked(idx)}
              disabled={verified}
            >
              <div className="flex w-full items-start gap-3 overflow-hidden">
                {/* letter badge stays fixed width */}
                <div className="shrink-0 rounded-md border px-2 py-1 text-sm leading-none">
                  {letter(idx)}
                </div>

                {/* text container MUST be shrinkable to wrap */}
                <div className="min-w-0 flex-1">
                  <span className="block w-full min-w-0 break-words whitespace-pre-wrap hyphens-auto leading-relaxed">
                    {choice}
                  </span>
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      {/* actions */}
      <div className="flex flex-wrap gap-2">
        {!verified ? (
          <>
            <Button
              onClick={() => setPicked(null)}
              variant="secondary"
              disabled={picked == null}
            >
              Clear
            </Button>
            <Button onClick={onVerify} disabled={picked == null}>
              Verify
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </>
        ) : (
          <>
            {!finished ? (
              <Button onClick={onNext}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button onClick={onRestart}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restart
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {/* explanation */}
      {verified && q.explanation && (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <div className="mb-1 inline-flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Explanation
          </div>
          <div className="break-words whitespace-pre-wrap hyphens-auto leading-relaxed">
            {q.explanation}
          </div>
        </div>
      )}

      {/* final banner */}
      {finished && (
        <div className="rounded-md border bg-green-500/10 p-3 text-sm">
          <div className="font-medium">Well done!</div>
          <div>
            You scored{" "}
            <span className="font-semibold">
              {score} / {list.length}
            </span>
            .
          </div>
        </div>
      )}
    </div>
  );
}
