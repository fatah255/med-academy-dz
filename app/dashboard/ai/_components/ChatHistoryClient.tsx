"use client";

import Link from "next/link";
import { useMemo, useState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Trash2, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteChat } from "../actions";

type ChatLite = {
  id: string;
  pdfName: string;
  createdAt: string; // passed as string from server
  _count: { chatMessage: number };
};

export default function ChatHistoryClient({
  initialChats,
}: {
  initialChats: ChatLite[];
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return initialChats;
    return initialChats.filter((c) => c.pdfName.toLowerCase().includes(needle));
  }, [q, initialChats]);

  return (
    <aside className="sticky top-4 h-[calc(100dvh-2rem)] overflow-hidden">
      <Card className="h-full flex flex-col">
        <CardTitle className="px-3 pt-3 text-base">Your PDF Chats</CardTitle>
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats…"
              className="pl-8"
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-6">
              No chats{" "}
              {q
                ? "match your search."
                : "yet. Upload a PDF to start chatting."}
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((c) => (
                <li key={c.id} className="group">
                  <div className="flex items-center gap-2 rounded-md border bg-card/50 hover:bg-accent/50 transition">
                    <Link
                      href={`/dashboard/ai/${c.id}`}
                      className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2"
                    >
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {c.pdfName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleString()} •{" "}
                          {c._count.chatMessage} msg
                          {c._count.chatMessage === 1 ? "" : "s"}
                        </p>
                      </div>
                    </Link>

                    {/* Delete in a Dialog */}
                    <DeleteChatDialog id={c.id} title={c.pdfName} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-3 border-t text-xs text-muted-foreground">
          Tip: Use the search to quickly find a PDF by name.
        </div>
      </Card>
    </aside>
  );
}

function DeleteChatDialog({ id, title }: { id: string; title: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the chat and all its messages. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>

          {/* We still use a form to call the server action safely */}
          <form ref={formRef} action={deleteChat}>
            <input type="hidden" name="id" value={id} />
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                startTransition(() => formRef.current?.requestSubmit());
              }}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
