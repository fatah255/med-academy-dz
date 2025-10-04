import Link from "next/link";
import { listChats, deleteChat } from "../actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Trash2, Search } from "lucide-react";

export default async function ChatHistory() {
  const chats = await listChats();

  return (
    <aside className="sticky top-4 h-[calc(100dvh-2rem)] overflow-hidden">
      <Card className="h-full flex flex-col">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats…"
              className="pl-8"
              onChange={(e) => {
                const q = e.currentTarget.value.toLowerCase();
                for (const el of document.querySelectorAll<HTMLElement>(
                  "[data-title]"
                )) {
                  const t = (el.dataset.title ?? "").toLowerCase();
                  el.style.display = t.includes(q) ? "" : "none";
                }
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {chats.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-6">
              No chats yet. Upload a PDF to start chatting.
            </p>
          ) : (
            <ul className="space-y-2">
              {chats.map((c) => (
                <li key={c.id} data-title={c.pdfName} className="group">
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

                    <form
                      action={deleteChat}
                      onSubmit={(e) => {
                        if (!confirm("Delete this chat?")) e.preventDefault();
                      }}
                      className="pr-1"
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-3 border-t text-xs text-muted-foreground">
          Tip: Use the Dashboard sidebar to navigate modules; this panel is only
          your AI chat history.
        </div>
      </Card>
    </aside>
  );
}
