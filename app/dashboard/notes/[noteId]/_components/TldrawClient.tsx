"use client"; // (only if your page itself needs to be client; otherwise keep it server)

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const TldrawCanvas = dynamic(() => import("./TldrawCanvas"), {
  ssr: false,
  loading: () => <Skeleton className="w-full aspect-[16/9]" />,
});

export default function TldrawClient({ noteId }: { noteId: string }) {
  return <TldrawCanvas noteId={noteId} />;
}
