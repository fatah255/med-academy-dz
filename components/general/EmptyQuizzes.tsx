import { Ban } from "lucide-react";
import React from "react";
import { buttonVariants } from "../ui/button";
import Link from "next/link";

const EmptyQuizzes = () => {
  return (
    <div className="flex flex-1 flex-col h-full items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
      <Ban className="mb-4 h-12 w-12 text-primary" />
      <h2 className="mb-2 text-lg font-semibold">No Quizzes Available</h2>
      <p className="text-sm text-muted-foreground">
        You haven't created any quizzes yet.
      </p>
      <Link
        href="/admin/quizzes/create"
        className={buttonVariants({
          className: "mt-4 w-full cursor-pointer",
        })}
      >
        Create Quiz
      </Link>
    </div>
  );
};

export default EmptyQuizzes;
