"use client"; // (only if your page itself needs to be client; otherwise keep it server)

import dynamic from "next/dynamic";

const TldrawCanvas = dynamic(() => import("./TldrawCanvas"), {
  ssr: false,
  loading: () => <div className="p-4">Loading canvas…</div>,
});

export default function TldrawClient({ noteId }: { noteId: string }) {
  return <TldrawCanvas noteId={noteId} />;
}
