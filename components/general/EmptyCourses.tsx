import { Ban } from "lucide-react";
import React from "react";
import { Button, buttonVariants } from "../ui/button";
import Link from "next/link";

const EmptyCourses = () => {
  return (
    <div className="flex flex-1 flex-col h-full items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
      <Ban className="mb-4 h-12 w-12 text-primary" />
      <h2 className="mb-2 text-lg font-semibold">No Courses Available</h2>
      <p className="text-sm text-muted-foreground">
        You haven't created any courses yet.
      </p>
      <Link
        href="/admin/courses/create"
        className={buttonVariants({
          className: "mt-4 w-full cursor-pointer",
        })}
      >
        Create Course
      </Link>
    </div>
  );
};

export default EmptyCourses;
