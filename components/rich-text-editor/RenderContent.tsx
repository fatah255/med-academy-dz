"use client";

import { useMemo } from "react";
import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import parse from "html-react-parser";
import type { JSONContent } from "@tiptap/react";

type ContentProp = string | JSONContent | null | undefined;

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

const RenderContent = ({ content }: { content: ContentProp }) => {
  const json: JSONContent = useMemo(() => {
    if (!content) return EMPTY_DOC;
    if (typeof content === "string") {
      try {
        return JSON.parse(content) as JSONContent;
      } catch {
        return EMPTY_DOC;
      }
    }
    return content;
  }, [content]);

  const html = useMemo(
    () =>
      generateHTML(json, [
        StarterKit,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
      ]),
    [json]
  );

  return (
    <div className="prose dark:prose-invert prose-li:marker:text-primary">
      {parse(html)}
    </div>
  );
};

export default RenderContent;
// "use client";

// import { useMemo } from "react";
// import { generateHTML, JSONContent } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import TextAlign from "@tiptap/extension-text-align";
// import parse from "html-react-parser";

// const RenderContent = ({ content }: { content: string }) => {
//   const output = useMemo(() => {
//     return generateHTML(JSON.parse(content), [
//       StarterKit,
//       TextAlign.configure({ types: ["heading", "paragraph"] }),
//     ]);
//   }, [content]);

//   return (
//     <div className="prose dark:prose-invert prose-li:marker:text-primary">
//       {parse(output)}
//     </div>
//   );
// };

// export default RenderContent;
