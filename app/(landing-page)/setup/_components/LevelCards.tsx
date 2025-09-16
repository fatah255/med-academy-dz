"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils"; // if you don't have this, replace `cn` with template string conditionals

// Adjust values to your Prisma enum values if different
const LEVELS = [
  { value: "FIRST_YEAR", label: "1st Year", hint: "Foundations & intros" },
  { value: "SECOND_YEAR", label: "2nd Year", hint: "Core subjects deepen" },
  { value: "THIRD_YEAR", label: "3rd Year", hint: "Advanced modules" },
  { value: "FOURTH_YEAR", label: "4th Year", hint: "Specialization tracks" },
  { value: "FIFTH_YEAR", label: "5th Year", hint: "Exam & internship focus" },
  { value: "SIXTH_YEAR", label: "6th Year", hint: "Exam & internship focus" },
];

export default function LevelCards() {
  const [selected, setSelected] = useState<string>("FIRST_YEAR");

  return (
    <>
      {/* Hidden input for server action */}
      <input type="hidden" name="level" value={selected} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LEVELS.map((lvl) => {
          const isActive = selected === lvl.value;
          return (
            <button
              key={lvl.value}
              type="button"
              onClick={() => setSelected(lvl.value)}
              className="text-left"
            >
              <Card
                className={cn(
                  "h-full transition-all border-2 hover:border-primary/40 hover:shadow-md",
                  isActive
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-muted"
                )}
              >
                <CardContent className="p-5 flex items-start gap-3">
                  <div
                    className={cn(
                      "rounded-xl p-2",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Sparkles className="size-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{lvl.label}</p>
                      {isActive ? (
                        <Badge className="gap-1" variant="default">
                          <Check className="size-3.5" />
                          Selected
                        </Badge>
                      ) : (
                        <Badge variant="outline">Choose</Badge>
                      )}
                    </div>
                    {/* <p className="mt-1 text-sm text-muted-foreground">
                      {lvl.hint}
                    </p> */}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </>
  );
}
