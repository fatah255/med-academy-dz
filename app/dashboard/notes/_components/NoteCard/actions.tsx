"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "./ConfirmModal";
import { Button } from "@/components/ui/button";
import { deleteNote } from "@/app/dashboard/notes/actions";
import { DropdownMenuContentProps } from "@radix-ui/react-dropdown-menu";
import RenameNoteDialog from "./RenameNoteDialog";
import * as React from "react";

interface ActionsProps {
  children: React.ReactNode;
  side?: DropdownMenuContentProps["side"];
  sideOffset?: DropdownMenuContentProps["sideOffset"];
  id: string;
  title: string;
}

const Actions = ({ children, side, sideOffset, id, title }: ActionsProps) => {
  const [renameOpen, setRenameOpen] = React.useState(false);

  const onDelete = async () => {
    try {
      await deleteNote(id);
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/dashboard/notes/${id}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent
          onClick={(e) => e.stopPropagation()}
          side={side}
          sideOffset={sideOffset}
          className="w-56"
        >
          <DropdownMenuItem
            onClick={() => setRenameOpen(true)}
            className="p-3 cursor-pointer"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Rename
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <ConfirmModal
            header="Delete note?"
            description="This will permanently delete the note and its content."
            onConfirm={onDelete}
          >
            <Button
              variant="ghost"
              className="p-3 w-full justify-start items-center text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </ConfirmModal>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Real rename modal */}
      <RenameNoteDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        noteId={id}
        currentTitle={title}
      />
    </>
  );
};

export default Actions;
