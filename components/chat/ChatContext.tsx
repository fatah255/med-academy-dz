"use client";

import { ReactNode, createContext, useRef, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const INFINITE_QUERY_LIMIT = 20;

export type StreamResponse = {
  addMessage: () => void;
  message: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
};

export const ChatContext = createContext<StreamResponse>({
  addMessage: () => {},
  message: "",
  handleInputChange: () => {},
  isLoading: false,
});

interface Props {
  chatId: string;
  children: ReactNode;
}

const messagesKey = (chatId: string) => ["chat-messages", chatId] as const;

export const ChatContextProvider = ({ chatId, children }: Props) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const backupMessage = useRef("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const res = await fetch("/api/message", {
        method: "POST",
        body: JSON.stringify({ chatId, message }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.body; // ReadableStream
    },

    // optimistic update
    onMutate: async ({ message }) => {
      backupMessage.current = message;
      setMessage("");

      await queryClient.cancelQueries({ queryKey: messagesKey(chatId) });

      const previous = queryClient.getQueryData<{
        pages: { messages: any[]; nextCursor?: string }[];
        pageParams: unknown[];
      }>(messagesKey(chatId));

      queryClient.setQueryData(messagesKey(chatId), (old: any) => {
        if (!old) return { pages: [{ messages: [] }], pageParams: [] };
        const pages = [...old.pages];
        const first = { ...pages[0] };
        first.messages = [
          {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            text: message,
            isUserMessage: true,
          },
          ...(first.messages ?? []),
        ];
        pages[0] = first;
        return { ...old, pages };
      });

      setIsLoading(true);
      return { previous };
    },

    onSuccess: async (stream) => {
      setIsLoading(false);
      if (!stream) {
        toast({
          title: "There was a problem sending this message",
          description: "Please refresh this page and try again",
          variant: "destructive",
        });
        return;
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let acc = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        acc += decoder.decode(value || new Uint8Array());

        queryClient.setQueryData(messagesKey(chatId), (old: any) => {
          if (!old) return { pages: [{ messages: [] }], pageParams: [] };

          const pages = [...old.pages];
          const first = { ...pages[0] };
          const idx = first.messages.findIndex(
            (m: any) => m.id === "ai-response"
          );

          if (idx === -1) {
            first.messages = [
              {
                id: "ai-response",
                createdAt: new Date().toISOString(),
                text: acc,
                isUserMessage: false,
              },
              ...first.messages,
            ];
          } else {
            first.messages = first.messages.map((m: any) =>
              m.id === "ai-response" ? { ...m, text: acc } : m
            );
          }

          pages[0] = first;
          return { ...old, pages };
        });
      }
    },

    onError: (_err, _vars, ctx) => {
      setMessage(backupMessage.current);
      if (ctx?.previous)
        queryClient.setQueryData(messagesKey(chatId), ctx.previous);
    },

    onSettled: () => {
      setIsLoading(false);
      queryClient.invalidateQueries({ queryKey: messagesKey(chatId) });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setMessage(e.target.value);

  const addMessage = () => {
    if (message.trim()) sendMessage({ message });
  };

  return (
    <ChatContext.Provider
      value={{ addMessage, message, handleInputChange, isLoading }}
    >
      {children}
    </ChatContext.Provider>
  );
};
