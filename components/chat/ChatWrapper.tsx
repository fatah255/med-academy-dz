// components/chat/ChatWrapper.tsx
"use client";

import ChatInput from "./ChatInput";
import { ChevronLeft, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { ChatContextProvider } from "./ChatContext";
import Messages from "./Messages";

type Status = "SUCCESS" | "FAILED" | "PROCESSING";

interface ChatWrapperProps {
  fileId: string;
  isSubscribed: boolean;
}

let data: { status: Status } = { status: "SUCCESS" };

const ChatWrapper = ({ fileId, isSubscribed }: ChatWrapperProps) => {
  const isLoading = false;

  if (isLoading) {
    return (
      <Shell>
        <Center>
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <h3 className="font-semibold text-xl">Loading...</h3>
          <p className="text-zinc-500 text-sm">
            We&apos;re preparing your PDF.
          </p>
        </Center>
        <ChatInput isDisabled />
      </Shell>
    );
  }

  if (data?.status === "PROCESSING") {
    return (
      <Shell>
        <Center>
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <h3 className="font-semibold text-xl">Processing PDF...</h3>
          <p className="text-zinc-500 text-sm">This won&apos;t take long.</p>
        </Center>
        <ChatInput isDisabled />
      </Shell>
    );
  }

  if (data?.status === "FAILED") {
    return (
      <Shell>
        <Center>
          <XCircle className="h-8 w-8 text-red-500" />
          <h3 className="font-semibold text-xl">Too many pages in PDF</h3>
          <p className="text-zinc-500 text-sm">
            Your{" "}
            <span className="font-medium">{isSubscribed ? "Pro" : "Free"}</span>{" "}
            plan supports up to 1 page per PDF.
          </p>
          <Link
            href="/dashboard/ai"
            className={buttonVariants({
              variant: "secondary",
              className: "mt-4",
            })}
          >
            <ChevronLeft className="h-3 w-3 mr-1.5" />
            Back
          </Link>
        </Center>
        <ChatInput isDisabled />
      </Shell>
    );
  }

  return (
    <ChatContextProvider chatId={fileId}>
      <Shell>
        {/* 👇 no more mb-28; and make this area flexible */}
        <div className="flex-1 min-h-0">
          <Messages chatId={fileId} />
        </div>
        <ChatInput />
      </Shell>
    </ChatContextProvider>
  );
};

export default ChatWrapper;

// containers
function Shell({ children }: { children: React.ReactNode }) {
  return (
    // 👇 min-h-0 + h-full so children can use remaining height without leaving a gap
    <div className="relative flex h-full min-h-0 flex-col bg-zinc-50 dark:bg-zinc-950">
      {children}
    </div>
  );
}
function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex justify-center items-center flex-col gap-2">
      {children}
    </div>
  );
}
