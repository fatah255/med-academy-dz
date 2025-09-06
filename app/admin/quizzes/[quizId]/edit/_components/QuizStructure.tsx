"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSingleQuizType } from "@/app/data/admin/admin-get-quiz";
import NewQcmModal from "./NewQcmModal";
import NormalQuestionCard from "./NormalQuestionCard";
import CliniqueQuestionCard from "./CliniqueQuestionCard";

interface QuizStructureProps {
  quiz: AdminSingleQuizType;
  coursId: string;
}

type AnswerItem = {
  id: string;
  text: string;
  order: number;
  isCorrect: boolean;
};

export type QuestionItem = {
  id: string;
  question: string;
  order: number;
  typeId: number;
  isOpen: boolean;
  answers: AnswerItem[];
  // parentId is optional; we don't rely on it for top-level filtering
  parentId?: string | null;
  comment?: string | null; // ← add this
};

const QuizStructure = ({ quiz, coursId }: QuizStructureProps) => {
  // Build a quick lookup of parent -> childIds from the server payload
  const childMap = useMemo(() => {
    const map = new Map<string, string[]>();
    const course = quiz.cours.find((c) => c.id === coursId);
    if (course) {
      for (const q of course.qcm) {
        const kids = (q as any).other_qcm ?? [];
        if (kids.length)
          map.set(
            q.id,
            kids.map((k: any) => k.id)
          );
      }
    }
    return map;
  }, [quiz, coursId]);

  // Set of all child IDs (so we can hide them at the top level)
  const childIdSet = useMemo(() => {
    const s = new Set<string>();
    childMap.forEach((ids) => ids.forEach((id) => s.add(id)));
    return s;
  }, [childMap]);

  const mapQuizToState = (
    keepOpenFrom?: Record<string, boolean>
  ): QuestionItem[] => {
    const course = quiz.cours.find((c) => c.id === coursId);
    if (!course) return [];
    return course.qcm.map((qcm: any) => ({
      id: qcm.id,
      question: qcm.question,
      comment: (qcm as any).comment ?? null,
      order: qcm.position,
      typeId: +qcm.typeQuestionId,
      isOpen: keepOpenFrom?.[qcm.id] ?? true,
      parentId: qcm.parentId ?? null, // may be undefined in payload; we don't rely on it
      answers: qcm.answers.map((answer: any) => ({
        id: answer.id,
        text: answer.text,
        order: answer.position,
        isCorrect: answer.isCorrect,
      })),
    }));
  };

  const [items, setItems] = useState<QuestionItem[]>(() => mapQuizToState());

  // Preserve open/closed state when quiz data refreshes
  useEffect(() => {
    const openMap = Object.fromEntries(items.map((i) => [i.id, i.isOpen]));
    setItems(mapQuizToState(openMap));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz]);

  const toggleQcm = (qcmId: string) => {
    setItems((prev) =>
      prev.map((q) => (q.id === qcmId ? { ...q, isOpen: !q.isOpen } : q))
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border">
        <CardTitle>Questions</CardTitle>
        <NewQcmModal coursId={coursId} quizId={quiz.id} />
      </CardHeader>

      <CardContent className="space-y-8">
        {items
          // Show only root questions at the top; children render under their parent (via other_qcm)
          .filter((item) => !childIdSet.has(item.id))
          .map((item) => {
            if (item.typeId < 5) {
              // Normal question
              return (
                <NormalQuestionCard
                  key={item.id}
                  item={item}
                  quizId={quiz.id}
                  coursId={coursId}
                  onToggle={toggleQcm}
                />
              );
            } else {
              // Clinical stem with sub-questions
              const subItems = (childMap.get(item.id) || [])
                .map((id) => items.find((q) => q.id === id))
                .filter(Boolean) as QuestionItem[];
              return (
                <CliniqueQuestionCard
                  key={item.id}
                  item={item}
                  quizId={quiz.id}
                  coursId={coursId}
                  onToggle={toggleQcm}
                  subItems={subItems}
                />
              );
            }
          })}
      </CardContent>
    </Card>
  );
};

export default QuizStructure;
