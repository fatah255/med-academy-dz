// File: components/attempts/CommentHtml.tsx
"use client";

import DOMPurify from "isomorphic-dompurify";

export default function CommentHtml({ html }: { html: string }) {
  if (!html) return null;
  let clean = html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const body = doc?.body?.innerHTML;
    if (body) clean = body;
  } catch {}
  const safe = DOMPurify.sanitize(clean, { ADD_ATTR: ["style"] });
  return (
    <div className="mcq-comment" dangerouslySetInnerHTML={{ __html: safe }} />
  );
}
