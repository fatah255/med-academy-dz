"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DraggableSyntheticListeners,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, GripVerticalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { AdminSingleQuizType } from "@/app/data/admin/admin-get-quiz";
import { reorderAnswers, reorderQcm } from "../actions";
import NewQcmModal from "./NewQcmModal";
import DeleteQuestionModal from "./DeleteQuestion";
import DeleteAnswerModal from "./DeleteAnswer";
import NewAnswerModal from "./NewAnswerModal";
import EditAnswerModal from "./EditAnswerModal";
import EditQcmModal from "./EditQcmModal";

interface QuizStructureProps {
  quiz: AdminSingleQuizType;
}

interface SortableItemProps {
  id: string;
  children: (listeners: DraggableSyntheticListeners) => React.ReactNode;
  className?: string;
  data?: {
    type: "qcm" | "answer";
    qcmId?: string; // only for answers
  };
}

export const numToLetter = new Map(
  Array.from({ length: 26 }, (_, i) => [i + 1, String.fromCharCode(65 + i)])
);

const QuizStructure = ({ quiz }: QuizStructureProps) => {
  const mapQuizToState = (keepOpenFrom?: Record<string, boolean>) =>
    quiz.qcm.map((qcm) => ({
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
    }));

  const [items, setItems] = useState(() => mapQuizToState());

  useEffect(() => {
    // preserve expanded state on refresh
    const openMap = Object.fromEntries(items.map((i) => [i.id, i.isOpen]));
    setItems(mapQuizToState(openMap));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz]);

  function SortableItem({ id, children, className, data }: SortableItemProps) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id, data });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={cn("touch-none", className, isDragging && "z-10")}
      >
        {children(listeners)}
      </div>
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type as
      | "qcm"
      | "answer"
      | undefined;
    const overType = over.data.current?.type as "qcm" | "answer" | undefined;

    // --- Reorder QCMs (top level) ---
    if (activeType === "qcm" && overType === "qcm") {
      const oldIndex = items.findIndex((c) => c.id === active.id);
      const newIndex = items.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const moved = arrayMove(items, oldIndex, newIndex).map((c, i) => ({
        ...c,
        order: i + 1,
      }));

      const prev = items;
      setItems(moved);

      const payload = moved.map((qcm) => ({ id: qcm.id, position: qcm.order }));

      const promise = reorderQcm(quiz.id, payload).then((r) => {
        if (r.status === "success") {
          return r.message;
        } else {
          throw new Error(r.message);
        }
      });

      toast.promise(promise, {
        loading: "Reordering questions...",
        success: (message) => message,
        error: (err) => {
          setItems(prev);
          return err instanceof Error
            ? err.message
            : "Failed to reorder questions";
        },
      });
      return;
    }

    // --- Reorder answers within the same QCM ---
    if (activeType === "answer" && overType === "answer") {
      const activeQcmId = active.data.current?.qcmId as string | undefined;
      const overQcmId = over.data.current?.qcmId as string | undefined;
      if (!activeQcmId || activeQcmId !== overQcmId) {
        toast.error("Drag answers within the same question only");
        return;
      }

      const qcmIndex = items.findIndex((c) => c.id === activeQcmId);
      if (qcmIndex < 0) return;

      const qcm = items[qcmIndex];
      const oldIdx = qcm.answers.findIndex((a) => a.id === active.id);
      const newIdx = qcm.answers.findIndex((a) => a.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return;

      const reordered = arrayMove(qcm.answers, oldIdx, newIdx).map((a, i) => ({
        ...a,
        order: i + 1,
      }));

      const nextItems = [...items];
      nextItems[qcmIndex] = { ...qcm, answers: reordered };

      const prev = items;
      setItems(nextItems);

      const payload = reordered.map((a) => ({ id: a.id, position: a.order }));

      const promise = reorderAnswers(activeQcmId, payload, quiz.id).then(
        (r) => {
          if (r.status === "success") {
            return r.message;
          } else {
            throw new Error(r.message);
          }
        }
      );

      toast.promise(promise, {
        loading: "Reordering answers...",
        success: (message) => message,
        error: (err) => {
          setItems(prev);
          return err instanceof Error
            ? err.message
            : "Failed to reorder answers";
        },
      });
      return;
    }
  }

  const toggleQcm = (qcmId: string) => {
    setItems((items) =>
      items.map((item) =>
        item.id === qcmId ? { ...item, isOpen: !item.isOpen } : item
      )
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      collisionDetection={rectIntersection}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border">
          <CardTitle>Questions</CardTitle>
          <NewQcmModal quizId={quiz.id} />
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Use ids array for clarity */}
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <SortableItem key={item.id} data={{ type: "qcm" }} id={item.id}>
                {(listeners) => (
                  <Card>
                    <Collapsible
                      open={item.isOpen}
                      onOpenChange={() => toggleQcm(item.id)}
                      className="w-full"
                    >
                      <div className="flex items-center justify-between p-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="cursor-grab opacity-60 hover:opacity-100"
                            {...listeners}
                          >
                            <GripVerticalIcon className="size-4" />
                          </Button>
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
                            quizId={quiz.id}
                            qcmId={item.id}
                            question={item.question}
                          />
                          <DeleteQuestionModal
                            qcmId={item.id}
                            quizId={quiz.id}
                          />
                        </div>
                      </div>

                      <CollapsibleContent>
                        <div className="p-1">
                          <SortableContext
                            strategy={verticalListSortingStrategy}
                            items={item.answers.map((a) => a.id)}
                          >
                            {item.answers.map((answer) => (
                              <SortableItem
                                key={answer.id}
                                id={answer.id}
                                data={{ type: "answer", qcmId: item.id }}
                              >
                                {(answerListeners) => (
                                  <div className="flex items-center justify-between p-2 hover:bg-accent rounded-sm">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        {...answerListeners}
                                      >
                                        <GripVerticalIcon className="size-4" />
                                      </Button>

                                      <span>
                                        {numToLetter.get(answer.order)}
                                        {" ) "}
                                      </span>
                                      {answer.text}
                                    </div>
                                    <div>
                                      <EditAnswerModal
                                        quizId={quiz.id}
                                        qcmId={item.id}
                                        answerText={answer.text}
                                        answerId={answer.id}
                                        isCorrect={answer.isCorrect}
                                      />
                                      <DeleteAnswerModal
                                        answerId={answer.id}
                                        qcmId={item.id}
                                        quizId={quiz.id}
                                      />
                                    </div>
                                  </div>
                                )}
                              </SortableItem>
                            ))}
                          </SortableContext>

                          <div className="p-2">
                            <NewAnswerModal quizId={quiz.id} qcmId={item.id} />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )}
              </SortableItem>
            ))}
          </SortableContext>
        </CardContent>
      </Card>
    </DndContext>
  );
};

export default QuizStructure;
