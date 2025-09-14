"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// Allow a few extra safe HTML tags the PDF parser emits
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "sub", "sup", "br", "span"],
  attributes: {
    ...(defaultSchema.attributes || {}),
    a: [...(defaultSchema.attributes?.a || []), ["target"], ["rel"]],
    span: [["className"]],
  },
};

type Msg = string | Array<{ type: string; text?: string; file?: any }>;

function normalizeContent(content: Msg) {
  const raw = Array.isArray(content)
    ? content
        .map((c) =>
          c.type === "text"
            ? c.text ?? ""
            : c.type === "file"
            ? `\n[📄 ${c.file?.filename ?? "document.pdf"}]`
            : ""
        )
        .join("\n")
    : content;

  // Replace literal "\n" with line breaks
  let text = raw.replaceAll("\\n", "\n");

  // Remove noisy <file ...> wrappers that may appear in annotations
  text = text.replace(/<\/?file[^>]*>/g, "");

  return text;
}

export default function AIMessage({ content }: { content: Msg }) {
  const text = normalizeContent(content);

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <ReactMarkdown
        // className="prose prose-slate dark:prose-invert max-w-none"
        // Markdown features
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        // HTML + math + code
        rehypePlugins={[
          rehypeRaw, // parse embedded HTML (e.g., <sub>)
          [rehypeSanitize, schema], // keep it safe
          rehypeKatex, // $...$ and $$...$$
          rehypeHighlight, // fenced code blocks
        ]}
        components={{
          //@ts-ignore
          code({ inline, className, children, ...props }) {
            if (inline) {
              return (
                <code className="rounded bg-muted px-1 py-[2px]" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="overflow-x-auto rounded-lg border bg-background/60 p-4">
                <code className={className} {...props}>
                  {String(children).replace(/\n$/, "")}
                </code>
              </pre>
            );
          },
          table({ children }) {
            return (
              <div className="not-prose overflow-x-auto">
                <table className="table-auto">{children}</table>
              </div>
            );
          },
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-4"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
