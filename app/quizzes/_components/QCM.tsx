// "use client";

// import React from "react";
// import Link from "next/link";
// import { differenceInSeconds } from "date-fns";
// import { BarChart, ChevronRight, Timer } from "lucide-react";

// import {
//   Card,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button, buttonVariants } from "@/components/ui/button";
// import { cn, formatTimeDelta } from "@/lib/utils";

// import MCQCounter from "./MCQCounter";
// import { toast } from "sonner";

// /** === UI shapes expected by this component ===
//  *  Map from your Prisma data (Quiz -> Qcm -> QcmAnswer):
//  *    options = answers[].text
//  *    correctIndex = index where answers[i].isCorrect === true (0-based)
//  */
// type UIQuestion = {
//   id: string;
//   question: string;
//   options: string[]; // e.g. ["A", "B", "C", "D"]
//   correctIndex: number; // 0-based index into options[]
// };

// export type UIGame = {
//   id: string; // attempt/game id (can be a placeholder if you don't persist)
//   topic: string; // e.g. quiz title
//   timeStarted: string | Date; // start timestamp
//   questions: UIQuestion[];
// };

// type Props = { game: UIGame };

// const MCQ: React.FC<Props> = ({ game }) => {
//   const [questionIndex, setQuestionIndex] = React.useState(0);
//   const [hasEnded, setHasEnded] = React.useState(false);
//   const [stats, setStats] = React.useState({
//     correct_answers: 0,
//     wrong_answers: 0,
//   });
//   const [selectedChoice, setSelectedChoice] = React.useState<number>(-1);
//   const [now, setNow] = React.useState(new Date());

//   const startedAt = React.useMemo(
//     () => new Date(game.timeStarted),
//     [game.timeStarted]
//   );

//   const currentQuestion = React.useMemo(
//     () => game.questions[questionIndex],
//     [game.questions, questionIndex]
//   );

//   React.useEffect(() => {
//     const interval = setInterval(() => {
//       if (!hasEnded) setNow(new Date());
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [hasEnded]);

//   const handleNext = React.useCallback(() => {
//     if (!currentQuestion) return;
//     if (selectedChoice < 0 || selectedChoice >= currentQuestion.options.length)
//       return;

//     const isCorrect = selectedChoice === currentQuestion.correctIndex;

//     if (isCorrect) {
//       setStats((s) => ({ ...s, correct_answers: s.correct_answers + 1 }));

//       toast.success("You got it right!");
//     } else {
//       setStats((s) => ({ ...s, wrong_answers: s.wrong_answers + 1 }));

//       toast.error("You got it wrong!");
//     }

//     const isLast = questionIndex === game.questions.length - 1;
//     if (isLast) {
//       setHasEnded(true);
//       return;
//     }

//     setQuestionIndex((i) => i + 1);
//     setSelectedChoice(-1); // reset for next question
//   }, [
//     currentQuestion,
//     questionIndex,
//     selectedChoice,
//     game.questions.length,
//     toast,
//   ]);

//   React.useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "1") setSelectedChoice(0);
//       else if (e.key === "2") setSelectedChoice(1);
//       else if (e.key === "3") setSelectedChoice(2);
//       else if (e.key === "4") setSelectedChoice(3);
//       else if (e.key === "Enter") handleNext();
//     };
//     document.addEventListener("keydown", onKey);
//     return () => document.removeEventListener("keydown", onKey);
//   }, [handleNext]);

//   if (hasEnded) {
//     return (
//       <div className="absolute flex flex-col justify-center -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
//         <div className="px-4 py-2 mt-2 font-semibold text-white bg-green-500 rounded-md whitespace-nowrap">
//           You Completed in{" "}
//           {formatTimeDelta(differenceInSeconds(now, startedAt))}
//         </div>
//         {/* Optional: keep or change this link depending on whether you persist attempts */}
//         <Link
//           href={`/statistics/${game.id}`}
//           className={cn(buttonVariants({ size: "lg" }), "mt-2")}
//         >
//           View Statistics
//           <BarChart className="w-4 h-4 ml-2" />
//         </Link>
//       </div>
//     );
//   }

//   return (
//     <div className="absolute -translate-x-1/2 -translate-y-1/2 md:w-[80vw] max-w-4xl w-[90vw] top-1/2 left-1/2">
//       <div className="flex flex-row justify-between">
//         <div className="flex flex-col">
//           <p>
//             <span className="text-slate-400">Topic</span>&nbsp;
//             <span className="px-2 py-1 text-white rounded-lg bg-slate-800">
//               {game.topic}
//             </span>
//           </p>
//           <div className="flex self-start mt-3 text-slate-400">
//             <Timer className="mr-2" />
//             {formatTimeDelta(differenceInSeconds(now, startedAt))}
//           </div>
//         </div>
//         <MCQCounter
//           correct_answers={stats.correct_answers}
//           wrong_answers={stats.wrong_answers}
//         />
//       </div>

//       <Card className="w-full mt-4">
//         <CardHeader className="flex flex-row items-center">
//           <CardTitle className="mr-5 text-center divide-y divide-zinc-600/50">
//             <div>{questionIndex + 1}</div>
//             <div className="text-base text-slate-400">
//               {game.questions.length}
//             </div>
//           </CardTitle>
//           <CardDescription className="flex-grow text-lg">
//             {currentQuestion?.question}
//           </CardDescription>
//         </CardHeader>
//       </Card>

//       <div className="flex flex-col items-center justify-center w-full mt-4">
//         {currentQuestion?.options.map((option, index) => (
//           <Button
//             key={`${currentQuestion.id}-${index}`}
//             variant={selectedChoice === index ? "default" : "outline"}
//             className="justify-start w-full py-8 mb-4"
//             onClick={() => setSelectedChoice(index)}
//             disabled={hasEnded}
//           >
//             <div className="flex items-center justify-start">
//               <div className="p-2 px-3 mr-5 border rounded-md">{index + 1}</div>
//               <div className="text-start">{option}</div>
//             </div>
//           </Button>
//         ))}

//         <Button
//           variant="default"
//           className="mt-2"
//           size="lg"
//           disabled={hasEnded || selectedChoice < 0}
//           onClick={handleNext}
//         >
//           Next <ChevronRight className="w-4 h-4 ml-2" />
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default MCQ;

"use client";

import React from "react";
import Link from "next/link";
import { differenceInSeconds } from "date-fns";
import { BarChart, ChevronRight, Timer } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn, formatTimeDelta } from "@/lib/utils";

import MCQCounter from "./MCQCounter";
import { toast } from "sonner";

/** === UI shapes expected by this component ===
 *  Map from Prisma (Quiz -> Qcm -> QcmAnswer):
 *    options        = answers[].text
 *    correctIndices = answers[].map((a,i) => a.isCorrect ? i : -1).filter(i => i >= 0)
 */
type UIQuestion = {
  id: string;
  question: string;
  options: string[]; // e.g. ["A", "B", "C", "D"]
  correctIndices: number[]; // one or more correct choices (0-based)
};

export type UIGame = {
  id: string; // attempt/game id (can be placeholder if not persisted)
  topic: string; // e.g. quiz title
  timeStarted: string | Date; // start timestamp
  questions: UIQuestion[];
};

type Props = { game: UIGame };

const MCQ: React.FC<Props> = ({ game }) => {
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [hasEnded, setHasEnded] = React.useState(false);
  const [stats, setStats] = React.useState({
    correct_answers: 0,
    wrong_answers: 0,
  });
  const [selectedChoices, setSelectedChoices] = React.useState<Set<number>>(
    () => new Set()
  );
  const [now, setNow] = React.useState(new Date());

  const startedAt = React.useMemo(
    () => new Date(game.timeStarted),
    [game.timeStarted]
  );

  const currentQuestion = React.useMemo(
    () => game.questions[questionIndex],
    [game.questions, questionIndex]
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!hasEnded) setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [hasEnded]);

  const toggleChoice = React.useCallback((idx: number) => {
    setSelectedChoices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const setsEqual = (a: Set<number>, b: Set<number>) =>
    a.size === b.size && [...a].every((v) => b.has(v));

  const handleNext = React.useCallback(() => {
    if (!currentQuestion) return;
    if (selectedChoices.size === 0) return;

    const correctSet = new Set(currentQuestion.correctIndices);
    const isCorrect = setsEqual(selectedChoices, correctSet);

    if (isCorrect) {
      setStats((s) => ({ ...s, correct_answers: s.correct_answers + 1 }));
      toast.success("Correct! (all required choices selected)");
    } else {
      setStats((s) => ({ ...s, wrong_answers: s.wrong_answers + 1 }));
      toast.error("Incorrect. (selections must match all correct choices)");
    }

    const isLast = questionIndex === game.questions.length - 1;
    if (isLast) {
      setHasEnded(true);
      return;
    }

    setQuestionIndex((i) => i + 1);
    setSelectedChoices(new Set()); // reset for next question
  }, [currentQuestion, questionIndex, selectedChoices, game.questions.length]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!currentQuestion) return;
      // Toggle selections with 1..9
      const num = Number(e.key);
      if (
        Number.isInteger(num) &&
        num >= 1 &&
        num <= currentQuestion.options.length
      ) {
        toggleChoice(num - 1);
      } else if (e.key === "Enter") {
        handleNext();
      } else if (e.key.toLowerCase() === "c") {
        // quick clear with "c"
        setSelectedChoices(new Set());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [currentQuestion, toggleChoice, handleNext]);

  if (hasEnded) {
    return (
      <div className="absolute flex flex-col justify-center -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
        <div className="px-4 py-2 mt-2 font-semibold text-white bg-green-500 rounded-md whitespace-nowrap">
          You Completed in{" "}
          {formatTimeDelta(differenceInSeconds(now, startedAt))}
        </div>
        <Link
          href={`/statistics/${game.id}`}
          className={cn(buttonVariants({ size: "lg" }), "mt-2")}
        >
          View Statistics
          <BarChart className="w-4 h-4 ml-2" />
        </Link>
      </div>
    );
  }

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 md:w-[80vw] max-w-4xl w-[90vw] top-1/2 left-1/2">
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          <p>
            <span className="text-slate-400">Topic</span>&nbsp;
            <span className="px-2 py-1 text-white rounded-lg bg-slate-800">
              {game.topic}
            </span>
          </p>
          <div className="flex self-start mt-3 text-slate-400">
            <Timer className="mr-2" />
            {formatTimeDelta(differenceInSeconds(now, startedAt))}
          </div>
        </div>
        <MCQCounter
          correct_answers={stats.correct_answers}
          wrong_answers={stats.wrong_answers}
        />
      </div>

      <Card className="w-full mt-4">
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="mr-5 text-center divide-y divide-zinc-600/50">
            <div>{questionIndex + 1}</div>
            <div className="text-base text-slate-400">
              {game.questions.length}
            </div>
          </CardTitle>
          <div className="flex flex-col flex-grow">
            <CardDescription className="text-lg">
              {currentQuestion?.question}
            </CardDescription>
            <span className="mt-1 text-xs text-slate-400">
              Select all that apply
            </span>
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-col items-center justify-center w-full mt-4">
        {currentQuestion?.options.map((option, index) => {
          const isSelected = selectedChoices.has(index);
          return (
            <Button
              key={`${currentQuestion.id}-${index}`}
              variant={isSelected ? "default" : "outline"}
              className="justify-start w-full py-8 mb-4"
              onClick={() => toggleChoice(index)}
            >
              <div className="flex items-center justify-start">
                <div className="p-2 px-3 mr-5 border rounded-md">
                  {index + 1}
                </div>
                <div className="text-start">{option}</div>
              </div>
            </Button>
          );
        })}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="mt-2"
            size={"lg"}
            onClick={() => setSelectedChoices(new Set())}
          >
            Clear
          </Button>

          <Button
            variant="default"
            className="mt-2"
            size="lg"
            disabled={selectedChoices.size === 0}
            onClick={handleNext}
          >
            Next <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MCQ;
