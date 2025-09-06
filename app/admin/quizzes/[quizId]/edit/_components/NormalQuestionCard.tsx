"use client";

import React from "react";
import DeleteQuestionModal from "./DeleteQuestion";
import DeleteAnswerModal from "./DeleteAnswer";
import NewAnswerModal from "./NewAnswerModal";
import EditAnswerModal from "./EditAnswerModal";
import EditQcmModal from "./EditQcmModal";
import EditQcmCommentModal from "./EditQcmCommentModal";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { QuestionItem } from "./QuizStructure";

const numToLetter = new Map(
  Array.from({ length: 26 }, (_, i) => [i + 1, String.fromCharCode(65 + i)])
);

type Props = {
  item: QuestionItem;
  quizId: string;
  coursId: string;
  onToggle: (qcmId: string) => void;
};

const NormalQuestionCard: React.FC<Props> = ({
  item,
  quizId,
  coursId,
  onToggle,
}) => {
  return (
    <Card className="w-full">
      <Collapsible
        open={item.isOpen}
        onOpenChange={() => onToggle(item.id)}
        className="w-full"
      >
        {/* Header row */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button size="icon" variant="ghost" className="flex items-center">
                {item.isOpen ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <p className="cursor-pointer hover:text-primary">{item.question}</p>
          </div>

          <div className="flex items-center">
            {/* Edit comment */}
            <EditQcmCommentModal
              qcmId={item.id}
              quizId={quizId}
              coursId={coursId}
              defaultComment={item.comment ?? ""}
              asTextButton
            />
            {/* Edit / Delete question */}
            <EditQcmModal
              coursId={coursId}
              quizId={quizId}
              qcmId={item.id}
              question={item.question}
            />
            <DeleteQuestionModal qcmId={item.id} quizId={quizId} />
          </div>
        </div>

        {/* Body */}
        <CollapsibleContent>
          <div className="p-3 space-y-3">
            {/* Comment display */}
            {item.comment ? (
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                {item.comment}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                No comment yet.
              </div>
            )}

            {/* Answers */}
            <div className="space-y-1">
              {item.answers.map((answer, i) => (
                <div
                  key={answer.id}
                  className="flex items-center justify-between p-2 hover:bg-accent rounded-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>
                      {numToLetter.get(i + 1)}
                      {" ) "}
                    </span>
                    {answer.text}
                  </div>
                  <div>
                    <EditAnswerModal
                      coursId={coursId}
                      quizId={quizId}
                      qcmId={item.id}
                      answerText={answer.text}
                      answerId={answer.id}
                      isCorrect={answer.isCorrect}
                    />
                    <DeleteAnswerModal
                      coursId={coursId}
                      answerId={answer.id}
                      qcmId={item.id}
                      quizId={quizId}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* New answer */}
            <div className="pt-1">
              <NewAnswerModal
                coursId={coursId}
                quizId={quizId}
                qcmId={item.id}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default NormalQuestionCard;
