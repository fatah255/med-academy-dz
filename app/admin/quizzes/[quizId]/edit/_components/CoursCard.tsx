"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AdminGetQuizCoursesCours } from "@/app/data/admin/admin-get-quiz-cours";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

export default function CoursCard({
  cours,
}: {
  cours: AdminGetQuizCoursesCours;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="w-full text-foreground text-sm rounded-lg border border-border p-4">
      <div className="font-medium">{cours.title}</div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="m-4 flex items-center justify-start gap-2 text-sm text-primary">
            <QuestionMarkCircleIcon className="size-5 mr-2 text-muted-foreground" />
            <Link href={`/admin/quizzes/${cours.quizId}/edit/${cours.id}`}>
              Edit {cours.title} quizzes
            </Link>
          </div>
        </CollapsibleContent>

        <div className="text-end">
          <CollapsibleTrigger asChild>
            <Button underlined="dashed" mode="link" size="sm">
              {isOpen ? (
                <ChevronDown className="size-4 rotate-180" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </Collapsible>
    </div>
  );
}
