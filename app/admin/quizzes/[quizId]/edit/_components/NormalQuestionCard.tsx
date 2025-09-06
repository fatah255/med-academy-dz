import React from "react";
import DeleteQuestionModal from "./DeleteQuestion";
import DeleteAnswerModal from "./DeleteAnswer";
import NewAnswerModal from "./NewAnswerModal";
import EditAnswerModal from "./EditAnswerModal";
import EditQcmModal from "./EditQcmModal";
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
    <Card>
      <Collapsible
        open={item.isOpen}
        onOpenChange={() => onToggle(item.id)}
        className="w-full"
      >
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
          <div>
            <EditQcmModal
              coursId={coursId}
              quizId={quizId}
              qcmId={item.id}
              question={item.question}
            />
            <DeleteQuestionModal qcmId={item.id} quizId={quizId} />
          </div>
        </div>

        <CollapsibleContent>
          <div className="p-1">
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

            <div className="p-2">
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
