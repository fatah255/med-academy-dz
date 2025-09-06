"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

import { AdminSingleQuizType } from "@/app/data/admin/admin-get-quiz";
import NewQcmModal from "./NewQcmModal";
import DeleteQuestionModal from "./DeleteQuestion";
import DeleteAnswerModal from "./DeleteAnswer";
import NewAnswerModal from "./NewAnswerModal";
import EditAnswerModal from "./EditAnswerModal";
import EditQcmModal from "./EditQcmModal";

interface QuizStructureProps {
  quiz: AdminSingleQuizType;
  coursId: string;
}

export const numToLetter = new Map(
  Array.from({ length: 26 }, (_, i) => [i + 1, String.fromCharCode(65 + i)])
);

const QuizStructure = ({ quiz, coursId }: QuizStructureProps) => {
  const mapQuizToState = (keepOpenFrom?: Record<string, boolean>) =>
    quiz.cours
      .filter((c) => c.id === coursId)
      .flatMap((c) =>
        c.qcm.map((qcm) => ({
          id: qcm.id,
          question: qcm.question,
          order: qcm.position,
          isOpen: keepOpenFrom?.[qcm.id] ?? true,
          answers: qcm.answers.map((answer) => ({
            id: answer.id,
            text: answer.text,
            order: answer.position,
            isCorrect: answer.isCorrect,
          })),
        }))
      );

  const [items, setItems] = useState(() => mapQuizToState());

  // Preserve open/closed state when quiz data refreshes
  useEffect(() => {
    const openMap = Object.fromEntries(items.map((i) => [i.id, i.isOpen]));
    setItems(mapQuizToState(openMap));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz]);

  const toggleQcm = (qcmId: string) => {
    setItems((items) =>
      items.map((item) =>
        item.id === qcmId ? { ...item, isOpen: !item.isOpen } : item
      )
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border">
        <CardTitle>Questions</CardTitle>
        {/* If your NewQcmModal now needs coursId, pass it here as well */}
        <NewQcmModal coursId={coursId} quizId={quiz.id} />
      </CardHeader>

      <CardContent className="space-y-8">
        {items.map((item) => (
          <Card key={item.id}>
            <Collapsible
              open={item.isOpen}
              onOpenChange={() => toggleQcm(item.id)}
              className="w-full"
            >
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="flex items-center"
                    >
                      {item.isOpen ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <p className="cursor-pointer hover:text-primary">
                    {item.question}
                  </p>
                </div>
                <div>
                  <EditQcmModal
                    coursId={coursId}
                    quizId={quiz.id}
                    qcmId={item.id}
                    question={item.question}
                  />
                  <DeleteQuestionModal qcmId={item.id} quizId={quiz.id} />
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
                          quizId={quiz.id}
                          qcmId={item.id}
                          answerText={answer.text}
                          answerId={answer.id}
                          isCorrect={answer.isCorrect}
                        />
                        <DeleteAnswerModal
                          coursId={coursId}
                          answerId={answer.id}
                          qcmId={item.id}
                          quizId={quiz.id}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="p-2">
                    <NewAnswerModal
                      coursId={coursId}
                      quizId={quiz.id}
                      qcmId={item.id}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuizStructure;
