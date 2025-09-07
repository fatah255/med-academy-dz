"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  // core editor + store
  Tldraw,
  createTLStore,
  getSnapshot,
  loadSnapshot,
  DefaultSpinner,
  // UI you can override
  DefaultMainMenu,
  DefaultMainMenuContent,
  DefaultToolbar,
  DefaultToolbarContent,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  TLComponents,
  // hooks for convenience (toolbar etc.)
  useEditor,
} from "tldraw";
import type { Editor } from "tldraw";
import { throttle } from "lodash";
import "tldraw/tldraw.css";

/* ------------------------------ utils ------------------------------ */

// Best-effort export that works across recent TLDraw versions.
function tryExportImage(editor: Editor) {
  try {
    // v2 / v3
    // @ts-expect-error – method name varies by version
    if (typeof editor.exportAs === "function") {
      // png, transparent bg, 2x scale
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
    // Some builds expose page export
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

  alert(
    "Export isn’t available in this TLDraw version. Use the default Export in the menu."
  );
}

function saveToLocalStorage(editor: Editor, key: string) {
  try {
    const snapshot = getSnapshot(editor.store);
    localStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

/* --------------------------- custom menus --------------------------- */

// Hamburger menu (top left): add “Export image…” and “Save”, then default items.
function CustomMainMenu({ persistenceKey }: { persistenceKey: string }) {
  const editor = useEditor();
  return (
    <DefaultMainMenu>
      <TldrawUiMenuGroup id="medacademy-quick">
        <TldrawUiMenuItem
          id="export-image"
          label="Export image…"
          icon="external-link"
          kbd="mod+shift+e" // ✅ correct tokens
          readonlyOk
          onSelect={() => tryExportImage(editor)}
        />
        <TldrawUiMenuItem
          id="save-board"
          label="Save"
          icon="download"
          kbd="mod+s" // ✅ correct tokens
          readonlyOk
          onSelect={() => saveToLocalStorage(editor, persistenceKey)}
        />
      </TldrawUiMenuGroup>
      <DefaultMainMenuContent />
    </DefaultMainMenu>
  );
}

// Keep the stock toolbar (looks like your screenshot).
function CustomToolbar() {
  return (
    <DefaultToolbar>
      <DefaultToolbarContent />
    </DefaultToolbar>
  );
}

/* ----------------------- components injection ---------------------- */

function makeComponents(persistenceKey: string): TLComponents {
  return {
    MainMenu: () => <CustomMainMenu persistenceKey={persistenceKey} />,
    Toolbar: CustomToolbar,
    // Everything else (context menu, zoom, quick actions, etc.) stays default
  };
}

/* ----------------------------- component --------------------------- */

export default function TldrawCanvas({ noteId }: { noteId: string }) {
  const PERSISTENCE_KEY = noteId;

  // Theme sync with shadcn
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // TLDraw store + persistence
  const store = useMemo(() => createTLStore(), []);
  const [loadingState, setLoadingState] = useState<
    | { status: "loading" }
    | { status: "ready" }
    | { status: "error"; error: string }
  >({ status: "loading" });

  useLayoutEffect(() => {
    setLoadingState({ status: "loading" });

    const raw = localStorage.getItem(PERSISTENCE_KEY);
    if (raw) {
      try {
        loadSnapshot(store, JSON.parse(raw));
        setLoadingState({ status: "ready" });
      } catch (err: any) {
        setLoadingState({
          status: "error",
          error: err?.message ?? "Failed to load board",
        });
      }
    } else {
      setLoadingState({ status: "ready" });
    }

    const unsub = store.listen(
      throttle(() => {
        const snapshot = getSnapshot(store);
        localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(snapshot));
      }, 450)
    );

    return () => unsub();
  }, [store, PERSISTENCE_KEY]);

  // Keyboard shortcuts (Ctrl/⌘+S, Ctrl/⌘+Shift+E)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const editor = (window as any).__tldraw__editor as Editor | undefined;
      if (!editor) return;

      const isMeta = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();

      if (isMeta && !e.shiftKey && k === "s") {
        e.preventDefault();
        saveToLocalStorage(editor, PERSISTENCE_KEY);
      } else if (isMeta && e.shiftKey && k === "e") {
        e.preventDefault();
        tryExportImage(editor);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [PERSISTENCE_KEY]);

  if (loadingState.status === "loading") {
    return (
      <div className="flex h-[calc(100svh-var(--header-height))] items-center justify-center">
        <DefaultSpinner />
      </div>
    );
  }

  if (loadingState.status === "error") {
    return (
      <div className="flex h-[calc(100svh-var(--header-height))] flex-col items-center justify-center gap-2">
        <p className="text-sm text-muted-foreground">Failed to load board</p>
        <pre className="text-xs opacity-70">{loadingState.error}</pre>
      </div>
    );
  }

  return (
    <div
      className="
        relative w-full
        h-[calc(100svh-var(--header-height))]
      "
    >
      {/* framed surface that matches your app */}
      <div className="h-full w-full overflow-hidden rounded-lg border bg-background">
        {mounted && (
          <Tldraw
            key={isDark ? "dark" : "light"}
            store={store}
            inferDarkMode={isDark}
            hideUi={false}
            components={makeComponents(PERSISTENCE_KEY)}
            onMount={(editor) => {
              // expose editor for kbd shortcuts
              (window as any).__tldraw__editor = editor;
            }}
          />
        )}
      </div>
    </div>
  );
}
