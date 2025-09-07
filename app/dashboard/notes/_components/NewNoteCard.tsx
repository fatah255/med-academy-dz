"use client";

import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createNote } from "../actions";

export default function NewNoteCard() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onClick = () => {
    startTransition(async () => {
      try {
        const note = await createNote(); // server reads session user
        if (!note?.id) throw new Error("No id returned");
        toast.success("Note created");
        router.push(`/dashboard/notes/${note.id}`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to create note");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-busy={isPending}
      className={cn(
        // sizing/layout
        "relative col-span-1 aspect-[3/4] w-40 sm:w-44",
        // card visuals
        "rounded-xl border border-border/60 bg-primary text-primary-foreground",
        "shadow-sm transition-all",
        // interactions
        "hover:translate-y-[-1px] hover:shadow-md",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // disabled
        isPending && "opacity-70 cursor-not-allowed"
      )}
    >
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10">
          <Plus className="h-6 w-6" />
        </span>
        <span className="text-sm font-medium">New Note</span>
      </div>

      {/* subtle inset highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/5 dark:ring-white/5" />
    </button>
  );
}
