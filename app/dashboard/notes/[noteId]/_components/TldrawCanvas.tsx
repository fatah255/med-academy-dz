// File: <wherever>/TldrawCanvas.tsx
"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useTheme } from "next-themes";
import {
  Tldraw,
  DefaultMainMenu,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  useEditor,
  createTLStore,
  loadSnapshot,
  getSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";
import { loadNoteSnapshot, saveNoteSnapshot } from "../actions";

/* ───────────────── helpers ───────────────── */

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ───────────────── menu items ───────────────── */

function SaveToDatabaseItem({ noteId }: { noteId: string }) {
  const editor = useEditor();
  const [pending, startTransition] = useTransition();

  return (
    <TldrawUiMenuItem
      id="save-board"
      label={pending ? "Saving…" : "Save"}
      icon="download"
      readonlyOk
      onSelect={() =>
        startTransition(async () => {
          const snapshot = getSnapshot(editor.store);
          await saveNoteSnapshot(noteId, JSON.stringify(snapshot));
        })
      }
    />
  );
}

function ExportPngItem() {
  const editor = useEditor();
  const [pending, startTransition] = useTransition();

  return (
    <TldrawUiMenuItem
      id="export-png"
      label={pending ? "Exporting…" : "Export PNG…"}
      icon="external-link"
      readonlyOk
      onSelect={() =>
        startTransition(async () => {
          try {
            const ids = editor.getCurrentPageShapeIds();
            if (ids.size === 0) {
              alert("No shapes on the canvas.");
              return;
            }

            // Official API (from docs): pass ids + options, use `format`
            const { blob } = await editor.toImage([...ids], {
              format: "png",
              background: false,
              scale: 2, // retina-ish
            });

            downloadBlob(blob, "board.png");
          } catch (e) {
            console.error("[tldraw] PNG export failed:", e);
            alert(
              "Export failed. Check the console for details.\nIf your canvas contains external images, ensure they have proper CORS headers."
            );
          }
        })
      }
    />
  );
}

function ExportSvgItem() {
  const editor = useEditor();
  const [pending, startTransition] = useTransition();

  return (
    <TldrawUiMenuItem
      id="export-svg"
      label={pending ? "Exporting…" : "Export SVG…"}
      icon="file"
      readonlyOk
      onSelect={() =>
        startTransition(async () => {
          try {
            const ids = editor.getCurrentPageShapeIds();
            if (ids.size === 0) {
              alert("No shapes on the canvas.");
              return;
            }

            // Prefer getSvgString with ids
            // @ts-expect-error – some builds don’t type this overload
            const svgString: string = await editor.getSvgString([...ids], {
              background: false,
            });

            const blob = new Blob([svgString], { type: "image/svg+xml" });
            downloadBlob(blob, "board.svg");
          } catch (e) {
            console.error("[tldraw] SVG export failed:", e);
            alert("SVG export failed. See console for details.");
          }
        })
      }
    />
  );
}

/** Keep ONLY Save + Export in the hamburger menu. */
function MainMenu({ noteId }: { noteId: string }) {
  return (
    <DefaultMainMenu>
      <TldrawUiMenuGroup id="medacademy">
        <SaveToDatabaseItem noteId={noteId} />
        <ExportPngItem />
        <ExportSvgItem />
      </TldrawUiMenuGroup>
      {/* No DefaultMainMenuContent -> everything else hidden */}
    </DefaultMainMenu>
  );
}

/* ───────────────── canvas ───────────────── */

export default function TldrawCanvas({ noteId }: { noteId: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const store = useMemo(() => createTLStore(), []);

  // Load saved snapshot when noteId changes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const json = await loadNoteSnapshot(noteId);
      if (!json) return;

      try {
        const snapshot = JSON.parse(json);
        if (!cancelled) loadSnapshot(store, snapshot);
      } catch {
        // ignore malformed snapshot
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [noteId, store]);

  return (
    <div className="h-[calc(100svh-var(--header-height,64px))] w-full overflow-hidden rounded-lg border bg-background">
      <Tldraw
        inferDarkMode={isDark}
        store={store}
        components={{
          MainMenu: () => <MainMenu noteId={noteId} />,
        }}
      />
    </div>
  );
}
