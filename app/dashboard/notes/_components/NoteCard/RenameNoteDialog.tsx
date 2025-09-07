// RenameNoteDialog.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { renameNote } from "@/app/dashboard/notes/actions";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  currentTitle: string;
};

export default function RenameNoteDialog({
  open,
  onOpenChange,
  noteId,
  currentTitle,
}: Props) {
  const router = useRouter();
  const [name, setName] = React.useState(currentTitle);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (open) setName(currentTitle);
  }, [open, currentTitle]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = name.trim();
    if (!next || next === currentTitle) {
      onOpenChange(false);
      return;
    }

    startTransition(async () => {
      const res = await renameNote(noteId, next);
      if (res?.ok) {
        toast.success("Note renamed");
        onOpenChange(false);
        router.refresh(); // refresh the list with the new title
      } else {
        toast.error(res?.error ?? "Failed to rename note");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && onOpenChange(v)}>
      <DialogContent
        className="sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Rename note</DialogTitle>
            <DialogDescription>Give your note a new title.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-2">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={isPending}
              placeholder="Untitled"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || name.trim() === ""}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
