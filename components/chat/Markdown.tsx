"use client";

import clsx from "clsx";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

// Styles for math & code highlighting
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.min.css"; // good for dark mode

type Props = {
  children: string;
  className?: string;
};

const sanitizeSchema = {
  ...defaultSchema,
  // allow a few extra attrs often used in parsed docs
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), ["className"]],
    span: [...(defaultSchema.attributes?.span || []), ["className"]],
    div: [...(defaultSchema.attributes?.div || []), ["className"]],
    sup: [...(defaultSchema.attributes?.sup || []), ["className"]],
    sub: [...(defaultSchema.attributes?.sub || []), ["className"]],
  },
};

export default function Markdown({ children, className }: Props) {
  return (
    <ReactMarkdown
      // GitHub flav + math
      remarkPlugins={[remarkGfm, remarkMath]}
      // Allow safe HTML + math + highlight
      rehypePlugins={[
        rehypeRaw,
        [rehypeSanitize, sanitizeSchema],
        rehypeKatex,
        [rehypeHighlight, { detect: true }],
      ]}
      // Components to style and add "copy" to code blocks
      components={{
        //@ts-ignore
        code({ inline, className, children, ...props }) {
          if (inline) {
            return (
              <code
                className={clsx(
                  "px-1 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800/70",
                  className
                )}
                {...props}
              >
                {children}
              </code>
            );
          }

          // fenced code block with copy button
          return (
            <CodeBlock className={className}>{String(children)}</CodeBlock>
          );
        },
        table({ children, ...props }) {
          return (
            <div className="not-prose overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm">{children}</table>
            </div>
          );
        },
        a({ children, href }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted hover:decoration-solid"
            >
              {children}
            </a>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className="relative not-prose group">
      <button
        onClick={onCopy}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700
                 opacity-0 group-hover:opacity-100 transition"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </button>

      <pre className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-x-auto">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
