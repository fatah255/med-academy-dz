// components/chat/ChatInput.tsx
import { Send, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useContext, useRef } from "react";
import { ChatContext } from "./ChatContext";

interface ChatInputProps {
  isDisabled?: boolean;
}

const ChatInput = ({ isDisabled }: ChatInputProps) => {
  const { addMessage, handleInputChange, isLoading, message } =
    useContext(ChatContext);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim() || isLoading || isDisabled) return;
    addMessage();
    textareaRef.current?.focus();
  };

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div
          className="relative rounded-2xl border border-border bg-muted/50 px-3 py-2 shadow-sm
                     focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20"
        >
          <Textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Enter your question…"
            className="h-10 w-full resize-none border-0 bg-transparent p-0 pr-10 text-base
                       placeholder:text-muted-foreground
                       focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
          />

          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={isLoading || isDisabled || !message.trim()}
            className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="mt-2 px-1 text-xs text-muted-foreground">
          Press <span className="font-medium">Enter</span> to send •{" "}
          <span className="font-medium">Shift + Enter</span> for a new line
        </p>
      </div>
    </footer>
  );
};

export default ChatInput;
