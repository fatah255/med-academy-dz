
"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AnswerLog = {
  questionId: string;
  question: string;
  options: string[];
  correctIndices: number[];
  selectedIndices: number[];
  isCorrect: boolean;
};

type Props = {
  answers: AnswerLog[];
};

const letter = (i: number) => String.fromCharCode("A".charCodeAt(0) + i);

const QuestionsList = ({ answers }: Props) => {
  if (!answers?.length) {
    return (
      <div className="mt-6 text-muted-foreground">No questions to display.</div>
    );
  }

  return (
    <Table className="mt-4">
      <TableCaption>End of list.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[10px]">No.</TableHead>
          <TableHead>Question &amp; Correct Answer(s)</TableHead>
          <TableHead>Your Answer(s)</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {answers.map((a, index) => {
          const correctLetters = a.correctIndices.map(letter).join(", ");
          const selectedLetters = a.selectedIndices.map(letter).join(", ");
          return (
            <TableRow key={a.questionId ?? index}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>
                {a.question}
                <br />
                <br />
                <span className="font-semibold">{correctLetters || "—"}</span>
              </TableCell>
              <TableCell
                className={`${
                  a.isCorrect ? "text-green-600" : "text-red-600"
                } font-semibold`}
              >
                {selectedLetters || "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default QuestionsList;
