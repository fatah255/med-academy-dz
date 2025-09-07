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

/* ------------------ Menu items ------------------ */

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
  return (
    <TldrawUiMenuItem
      id="export-image"
      label="Export image…"
      icon="external-link"
      readonlyOk
      onSelect={() => {
        try {
          // @ts-expect-error - different builds expose different names
          if (typeof editor.exportAs === "function") {
            // @ts-expect-error
            editor.exportAs("png", {
              background: false,
              scale: 2,
              filename: "board.png",
            });
            return;
          }
        } catch {}
        try {
          // @ts-expect-error
          if (typeof editor.exportPageAsImage === "function") {
            // @ts-expect-error
            editor.exportPageAsImage({
              format: "png",
              background: false,
              scale: 2,
              filename: "board.png",
            });
            return;
          }
        } catch {}
        alert("Export isn’t available in this build of tldraw.");
      }}
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
      </TldrawUiMenuGroup>
      {/* No DefaultMainMenuContent -> everything else hidden */}
    </DefaultMainMenu>
  );
}

/* ------------------ Canvas ------------------ */

export default function TldrawCanvas({ noteId }: { noteId: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // one store shared between TLDraw + loader
  const store = useMemo(() => createTLStore(), []);

  // Load the snapshot when the component mounts / noteId changes
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
