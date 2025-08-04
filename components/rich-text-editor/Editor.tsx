"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Menubar from "./Menubar";
import deepEqual from "deep-equal";
import { type Editor } from "@tiptap/react";
import TextAlign from "@tiptap/extension-text-align";

const RichTextEditor = ({ field }: { field: any }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    editorProps: {
      attributes: {
        class:
          "min-h-[300px] focus:outline-none prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert !w-full !max-w-none",
      },
    },
    onUpdate: ({ editor: editorInstance }) => {
      field.onChange(JSON.stringify(editorInstance.getJSON()));
    },
    content: field.value ? JSON.parse(field.value) : "",
    autofocus: "end",
    injectCSS: false,
    // This is important to ensure the editor is rendered immediately
    // and not delayed until the next render cycle.
    // It helps with SSR and hydration issues.

    immediatelyRender: true,

    shouldRerenderOnTransaction: false,
  });

  const editorState = useEditorState({
    editor,

    selector: ({ editor: editorInstance }: { editor: Editor }) => ({
      isBold: editorInstance.isActive("bold"),
      isItalic: editorInstance.isActive("italic"),
      isStrike: editorInstance.isActive("strike"),
      isHeading1: editorInstance.isActive("heading", { level: 1 }),
      isHeading2: editorInstance.isActive("heading", { level: 2 }),
      isHeading3: editorInstance.isActive("heading", { level: 3 }),
      isBulletList: editorInstance.isActive("bulletList"),
      isOrderedList: editorInstance.isActive("orderedList"),
      isAlignLeft: editorInstance.isActive({ textAlign: "left" }),
      isAlignCenter: editorInstance.isActive({ textAlign: "center" }),
      isAlignRight: editorInstance.isActive({ textAlign: "right" }),
      canUndo: editorInstance.can().undo(),
      canRedo: editorInstance.can().redo(),
    }),

    equalityFn: deepEqual,
  });

  return (
    <div className="w-full border border-input border-t-0 border-x-0 rounded-lg overflow-hidden dark:bg-input/30">
      <Menubar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
