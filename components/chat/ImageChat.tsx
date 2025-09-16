"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icons } from "../Icons";
import {
  X,
  ImageIcon,
  Send,
  Loader2,
  Sparkles,
  Paperclip,
  Maximize2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";

type Part =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: Part[];
};

// Small custom error so we can distinguish “rate-limit” from other errors
class UploadLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadLimitError";
  }
}

export default function ImageChat() {
  const controllerRef = useRef<AbortController | null>(null);

  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [bottomGap, setBottomGap] = useState(96);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!composerRef.current) return;
    const el = composerRef.current;
    const ro = new ResizeObserver(() => {
      setBottomGap(Math.max(64, el.offsetHeight + 16));
    });
    ro.observe(el);
    setBottomGap(Math.max(64, el.offsetHeight + 16));
    return () => ro.disconnect();
  }, []);

  const scrollToBottom = (b: ScrollBehavior = "smooth") =>
    endRef.current?.scrollIntoView({ behavior: b, block: "end" });

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      scrollToBottom(history.length <= 1 ? "auto" : "smooth")
    );
    return () => cancelAnimationFrame(id);
  }, [history, loading]);

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  const previews = useMemo(
    () =>
      files.map((f) => ({
        name: f.name,
        url: URL.createObjectURL(f),
        size: f.size,
        type: f.type,
      })),
    [files]
  );

  const removeFile = (idx: number) =>
    setFiles((arr) => arr.filter((_, i) => i !== idx));

  const MAX_MB = 20;

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    const accepted = picked.filter(
      (fi) => fi.type.startsWith("image/") && fi.size <= MAX_MB * 1024 * 1024
    );
    const rejectedCount = picked.length - accepted.length;
    if (rejectedCount > 0) {
      toast.error(`Some files were rejected (only images ≤ ${MAX_MB} MB).`);
    }
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const items = Array.from(e.dataTransfer.files || []);
    const accepted = items.filter(
      (fi) => fi.type.startsWith("image/") && fi.size <= MAX_MB * 1024 * 1024
    );
    const rejectedCount = items.length - accepted.length;
    if (rejectedCount > 0) {
      toast.error(`Some files were rejected (only images ≤ ${MAX_MB} MB).`);
    }
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
  };

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.files || []);
    const accepted = items.filter(
      (fi) => fi.type.startsWith("image/") && fi.size <= MAX_MB * 1024 * 1024
    );
    const rejectedCount = items.length - accepted.length;
    if (rejectedCount > 0) {
      toast.error(`Some files were rejected (only images ≤ ${MAX_MB} MB).`);
    }
    if (accepted.length) {
      e.preventDefault();
      setFiles((prev) => [...prev, ...accepted]);
    }
  };

  /** Ask server for a presigned URL, then PUT the file to S3/Tigris */
  async function uploadOneToTigris(file: File) {
    const signRes = await fetch("/api/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type, filename: file.name }),
      credentials: "include",
    });

    // Handle rate limit (ArcJet returns 429)
    if (signRes.status === 429) {
      let msg = "Upload limit reached. Please try again later.";
      try {
        const j = await signRes.json();
        if (j?.error) msg = j.error;
      } catch {}
      toast.error(msg, { id: "upload-limit" });
      throw new UploadLimitError(msg);
    }

    if (!signRes.ok) {
      const txt = await signRes.text();
      toast.error("Could not start upload.");
      throw new Error(`Presign failed: ${signRes.status} ${txt}`);
    }

    const { putUrl, publicUrl } = (await signRes.json()) as {
      putUrl: string;
      publicUrl: string;
    };

    const put = await fetch(putUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!put.ok) {
      // Common cases: 403 (expired/bad presign), 413 (too large if enforced by server policy)
      if (put.status === 403) {
        toast.error("Upload link expired. Please try again.");
      } else if (put.status === 413) {
        toast.error(`That image is too large (max ${MAX_MB} MB).`);
      } else {
        toast.error("Upload failed. Please retry.");
      }
      throw new Error(`Upload failed: ${put.status}`);
    }

    return publicUrl;
  }

  /** Replace the last assistant bubble’s text with `text` (no appending). */
  function setAssistantText(text: string) {
    setHistory((old) => {
      const next = [...old];
      const lastIdx = next.length - 1;
      if (lastIdx < 0 || next[lastIdx].role !== "assistant") {
        next.push({ role: "assistant", content: [{ type: "text", text }] });
        return next;
      }
      next[lastIdx] = {
        ...next[lastIdx],
        content: [{ type: "text", text }],
      };
      return next;
    });
  }

  const send = useCallback(async () => {
    if (!input.trim() && files.length === 0) return;

    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    setLoading(true);
    try {
      // 1) Upload selected images and build the outgoing user message
      const urls = await Promise.all(files.map(uploadOneToTigris));

      const uiParts: Part[] = [];
      if (input.trim()) uiParts.push({ type: "text", text: input.trim() });
      for (const url of urls)
        uiParts.push({ type: "image_url", image_url: { url } });

      const userMsg: ChatMessage = { role: "user", content: uiParts };
      setHistory((h) => [...h, userMsg]);
      setInput("");
      setFiles([]);

      const messagesForApi = [...history, userMsg];

      // 2) Call our API with streaming enabled
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          stream: true,
          messages: messagesForApi,
        }),
        signal: controllerRef.current.signal,
      });

      // If the upstream provider returned JSON (no streaming), handle it.
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        const msg = data?.choices?.[0]?.message;
        if (Array.isArray(msg?.content)) {
          const text = msg.content
            .filter((p: any) => p?.type === "text" && p?.text)
            .map((p: any) => p.text)
            .join("");
          setAssistantText(text || "⚠️ Empty response.");
        } else if (typeof msg?.content === "string") {
          setAssistantText(msg.content || "⚠️ Empty response.");
        } else {
          setAssistantText("⚠️ Empty response.");
        }
        return;
      }

      // 3) Stream parse SSE. Build a single accumulator and REPLACE bubble text.
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream from server");

      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      // Create (or ensure) the assistant bubble exists
      setAssistantText("");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // consume complete lines
        while (true) {
          const nl = buffer.indexOf("\n");
          if (nl === -1) break;

          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);

          if (!line || line.startsWith(":")) continue; // SSE keep-alives
          if (!line.startsWith("data:")) continue;

          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]") break;

          try {
            const json = JSON.parse(dataStr);
            // IMPORTANT: during streaming, ONLY use delta.content to avoid duplicates
            const piece = json?.choices?.[0]?.delta?.content;

            if (typeof piece === "string" && piece) {
              acc += piece;
              setAssistantText(acc);
            } else if (Array.isArray(piece)) {
              const joined = piece
                .filter((p: any) => p?.type === "text" && p?.text)
                .map((p: any) => p.text)
                .join("");
              if (joined) {
                acc += joined;
                setAssistantText(acc);
              }
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch (e: any) {
      setLoading(false);
      // If this was *only* an upload limit event, we've already shown a toast—no chat bubble.
      if (e?.name === "UploadLimitError") return;

      // Otherwise, show both a toast and a single assistant error bubble
      toast.error(e?.message || "Something went wrong.");
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: [{ type: "text", text: `Error: ${e?.message || e}` }],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [files, history, input]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div
      className="mx-auto grid h-[90vh] w-full max-w-4xl grid-rows-[auto_1fr_auto] gap-3 p-3 min-h-0"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {/* Header */}
      <Card className="overflow-hidden border-0 shadow-none">
        <CardContent className="p-0">
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/10 via-transparent to-primary/10">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">Image Chat</h2>
                    <Badge variant="secondary" className="rounded-full text-xs">
                      Vision
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Drop images, paste screenshots, or click Attach. Press
                    <span className="mx-1 rounded border px-1 py-0.5 text-[10px]">
                      Ctrl/⌘ + Enter
                    </span>
                    to send.
                  </p>
                </div>
              </div>
              <div className="hidden text-xs text-muted-foreground md:block">
                PNG · JPEG · WebP · GIF — up to {MAX_MB}MB each
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat area */}
      <Card className="flex min-h-0 flex-col overflow-hidden">
        <CardContent className="flex min-h-0 flex-1 p-0">
          <div
            ref={listRef}
            className="relative h-full min-h-0 flex-1 overflow-y-auto p-4"
            style={{ paddingBottom: bottomGap }}
          >
            {history.length === 0 && !loading && <EmptyState />}

            <div className="space-y-4">
              {history.map((m, i) => (
                <MessageBubble
                  key={i}
                  role={m.role}
                  parts={m.content}
                  onOpenImage={(url) => setLightboxUrl(url)}
                  onMediaLoad={() => scrollToBottom("auto")}
                />
              ))}
              {loading && <TypingDots />}
            </div>

            <div ref={endRef} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Composer */}
      <div
        ref={composerRef}
        className="rounded-2xl border bg-background p-3 shadow-sm"
      >
        <div className="flex items-end gap-2">
          <label className="group inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-muted">
            <Paperclip className="h-4 w-4" />
            <span>Attach</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onPick}
            />
          </label>

          <Textarea
            ref={textRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
            placeholder="Type your message…"
            className="min-h-[56px] flex-1 resize-none"
            rows={3}
          />

          <Button onClick={send} disabled={loading} className="self-stretch">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>

        {previews.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {previews.map((p, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-xl border bg-muted"
                style={{ width: 112, height: 80 }}
              >
                <Image src={p.url} alt={p.name} fill className="object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full border bg-background/85 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                  onClick={() => removeFile(idx)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog
        open={!!lightboxUrl}
        onOpenChange={(o) => !o && setLightboxUrl(null)}
      >
        <DialogContent className="max-w-4xl border-0 p-0 sm:rounded-2xl">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black/80">
            {lightboxUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightboxUrl}
                alt="preview"
                className="h-full w-full object-contain"
                onLoad={() => scrollToBottom("auto")}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- UI helpers ---------- */
function EmptyState() {
  return (
    <div className="grid h-full place-items-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h3 className="mb-1 text-base font-semibold">Ask about your photos</h3>
        <p className="text-sm text-muted-foreground">
          Upload to Tigris and I’ll analyze with a vision model.
        </p>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex animate-in fade-in slide-in-from-bottom-2">
      <div className="max-w-[85%] rounded-2xl border bg-background px-4 py-3 shadow">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.2s]" />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.1s]" />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70" />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  parts,
  onOpenImage,
  onMediaLoad,
}: {
  role: ChatMessage["role"];
  parts: Part[];
  onOpenImage: (url: string) => void;
  onMediaLoad: () => void;
}) {
  const me = role === "user";
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] items-start gap-3`}>
        {!me ? (
          <div className="hidden sm:grid size-8 place-items-center shrink-0 rounded-full border bg-background overflow-hidden">
            <Icons.logo className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        ) : (
          <div className="hidden sm:grid size-8 place-items-center shrink-0 rounded-full border bg-background overflow-hidden">
            <Icons.user className="h-4 w-4 shrink-0" />
          </div>
        )}

        <div
          className={`w-full rounded-2xl px-4 py-3 shadow ${
            me ? "bg-primary text-primary-foreground" : "border bg-background"
          }`}
        >
          {parts.map((p, idx) => (
            <div key={idx} className="mt-1 first:mt-0">
              {p.type === "text" && (
                <div
                  className={`prose prose-sm max-w-none leading-relaxed ${
                    me ? "prose-invert" : ""
                  }`}
                >
                  {p.text}
                </div>
              )}

              {p.type === "image_url" && (
                <div className="mt-2">
                  <div className="group relative overflow-hidden rounded-xl border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image_url.url}
                      alt="uploaded"
                      className="h-auto max-h-[60vh] w-full cursor-pointer bg-black/5 object-contain"
                      onLoad={onMediaLoad}
                      onClick={() => onOpenImage(p.image_url.url)}
                    />
                    <button
                      type="button"
                      className={`absolute right-2 top-2 hidden items-center gap-1 rounded-full border bg-background/85 px-2 py-1 text-xs backdrop-blur transition group-hover:flex ${
                        me ? "text-foreground" : "text-muted-foreground"
                      }`}
                      onClick={() => onOpenImage(p.image_url.url)}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      View
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
