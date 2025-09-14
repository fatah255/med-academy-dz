"use client";

import { cn } from "@/lib/utils";
import Markdown from "./Markdown";
import { format } from "date-fns";
import { forwardRef } from "react";
import { Icons } from "../Icons";

type ExtendedMessage = {
  id: string;
  createdAt: string;
  text: string | React.ReactNode;
  isUserMessage: boolean;
};

interface MessageProps {
  message: ExtendedMessage;
  isNextMessageSamePerson: boolean;
}

const Message = forwardRef<HTMLDivElement, MessageProps>(
  ({ message, isNextMessageSamePerson }, ref) => {
    const isUser = message.isUserMessage;

    return (
      <div
        ref={ref}
        className={cn("flex items-end", { "justify-end": isUser })}
      >
        <div
          className={cn(
            "relative flex h-6 w-6 aspect-square items-center justify-center",
            {
              "order-2 bg-blue-600 rounded-sm": isUser,
              "order-1 bg-zinc-800 rounded-sm": !isUser,
              invisible: isNextMessageSamePerson,
            }
          )}
        >
          {isUser ? (
            <Icons.user className="fill-zinc-200 text-zinc-200 h-3/4 w-3/4" />
          ) : (
            <Icons.logo className="fill-zinc-300 h-3/4 w-3/4" />
          )}
        </div>

        <div
          className={cn("flex flex-col space-y-2 text-base max-w-md mx-2", {
            "order-1 items-end": isUser,
            "order-2 items-start": !isUser,
          })}
        >
          <div
            className={cn(
              "px-4 py-2 rounded-lg inline-block",
              isUser
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-900 dark:bg-zinc-800 dark:text-zinc-50",
              {
                "rounded-br-none": !isNextMessageSamePerson && isUser,
                "rounded-bl-none": !isNextMessageSamePerson && !isUser,
              }
            )}
          >
            {typeof message.text === "string" ? (
              <Markdown className={cn(isUser && "prose-invert")}>
                {message.text}
              </Markdown>
            ) : (
              message.text
            )}

            {message.id !== "loading-message" ? (
              <div
                className={cn("text-xs select-none mt-2 w-full text-right", {
                  "text-zinc-500": !isUser,
                  "text-blue-300": isUser,
                })}
              >
                {format(new Date(message.createdAt), "HH:mm")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
);

Message.displayName = "Message";
export default Message;
