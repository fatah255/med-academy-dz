// components/ChatComponent.tsx
"use client";
import React from "react";
import { Input } from "./ui/input";
import { useChat } from "ai/react";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Message } from "ai";
import MessageList from "./messagesList";

type Props = { chatId: string }; // your chat id is a string in DB

export default function ChatComponent({ chatId }: Props) {
  // fetch existing messages from our GET endpoint
  const { data: initial, isLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async (): Promise<Message[]> => {
      const res = await axios.get("/api/messages", {
        params: { chatId, limit: 50 },
      });
      // API returns { messages: {text, isUserMessage, id}[] } — convert to ai.Message[]
      const msgs = (res.data?.messages ?? []).reverse(); // we requested desc
      return msgs.map((m: any) => ({
        id: m.id,
        role: m.isUserMessage ? "user" : "assistant",
        content: m.text,
      })) as Message[];
    },
  });

  const { input, handleInputChange, handleSubmit, messages } = useChat({
    api: "/api/message", // <-- our fixed API
    body: { chatId }, // extra field we’ll read server-side
    initialMessages: initial || [],
  });

  React.useEffect(() => {
    const el = document.getElementById("message-container");
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className="relative max-h-screen overflow-y-auto"
      id="message-container"
    >
      <div className="sticky top-0 inset-x-0 p-2 bg-background/80 backdrop-blur border-b">
        <h3 className="text-xl font-bold">Chat</h3>
      </div>

      <MessageList messages={messages} isLoading={isLoading} />

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 inset-x-0 px-2 py-4 bg-background/80 backdrop-blur border-t"
      >
        <div className="flex">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask any question..."
            className="w-full"
          />
          <Button type="submit" className="ml-2">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
