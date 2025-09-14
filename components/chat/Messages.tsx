"use client";

import { Loader2, MessageSquare } from "lucide-react";
import Message from "./Message";
import { useContext, useEffect, useRef } from "react";
import { ChatContext } from "./ChatContext";
import { useIntersection } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Skeleton } from "../ui/skeleton";

interface MessagesProps {
  chatId: string;
}

type Msg = {
  id: string;
  createdAt: string;
  text: string;
  isUserMessage: boolean;
};

type Page = { messages: Msg[]; nextCursor?: string | null };

async function fetchMessages({
  chatId,
  cursor,
}: {
  chatId: string;
  cursor?: string;
}) {
  const qs = new URLSearchParams({ chatId, limit: "20" });
  if (cursor) qs.set("cursor", cursor);
  const res = await fetch(`/api/messages?${qs.toString()}`);
  if (!res.ok) throw new Error("messages failed");
  return (await res.json()) as Page;
}

const Messages = ({ chatId }: MessagesProps) => {
  const { isLoading: isAiThinking } = useContext(ChatContext);

  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: ({ pageParam }) =>
      fetchMessages({ chatId, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const messages = data?.pages.flatMap((p) => p.messages) ?? [];

  const loadingMessage = {
    createdAt: new Date().toISOString(),
    id: "loading-message",
    isUserMessage: false,
    text: (
      <span className="flex h-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>
    ) as any,
  };

  const combined = [...(isAiThinking ? [loadingMessage] : []), ...messages];

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const { ref, entry } = useIntersection({
    root: lastMessageRef.current,
    threshold: 1,
  });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) fetchNextPage();
  }, [entry, fetchNextPage, hasNextPage]);

  return (
    <div className="flex max-h-[calc(100vh-3.5rem-7rem)] border-zinc-200 dark:border-zinc-800 flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto">
      {combined.length > 0 ? (
        combined.map((m, i) => {
          const isNextSame = combined[i - 1]?.isUserMessage === m.isUserMessage;
          if (i === combined.length - 1) {
            return (
              <Message
                ref={ref}
                message={m as any}
                isNextMessageSamePerson={!!isNextSame}
                key={m.id}
              />
            );
          }
          return (
            <Message
              message={m as any}
              isNextMessageSamePerson={!!isNextSame}
              key={m.id}
            />
          );
        })
      ) : isLoading ? (
        <div className="w-full flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <MessageSquare className="h-8 w-8 text-blue-500" />
          <h3 className="font-semibold text-xl">You&apos;re all set!</h3>
          <p className="text-zinc-500 text-sm">
            Ask your first question to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default Messages;
