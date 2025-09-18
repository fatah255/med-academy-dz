"use client";

import { useEffect, useMemo, useRef } from "react";
import type { INode } from "markmap-common";
import { Transformer } from "markmap-lib";
import { Markmap, type IMarkmapOptions } from "markmap-view";

// Convert bullets to sub-branches and keep lines tidy
function preprocessMarkdown(md: string) {
  let out = md.replace(/[ \t]+$/gm, "").replace(/\n{2,}/g, "\n");

  // ⬅️ Make bullets visible as real sub-branches
  out = out.replace(/^\s*-\s+/gm, "### ");

  // Trim very long headings
  out = out
    .split("\n")
    .map((line) =>
      /^#{2,6}\s+/.test(line) && line.length > 120
        ? line.slice(0, 117).trimEnd() + "…"
        : line
    )
    .join("\n");

  // Ensure first line is H1
  const lines = out.trim().split("\n");
  if (!lines[0]?.startsWith("# ")) {
    const fallback =
      lines.find((l) => /^#\s+/.test(l))?.replace(/^#\s+/, "") || "Mindmap";
    out = `# ${fallback}\n` + out;
  }
  return out;
}

export default function MindMapCanvas({
  markdown,
  height = 540,
}: {
  markdown: string;
  height?: number | string;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mmRef = useRef<Markmap | null>(null);
  const transformerRef = useRef<Transformer | null>(null);

  const cleaned = useMemo(() => preprocessMarkdown(markdown), [markdown]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    if (!transformerRef.current) transformerRef.current = new Transformer();

    // Clear previous render (fixes StrictMode double-mount overlays)
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    //@ts-ignore
    const { root } = transformerRef.current.transform(cleaned) as {
      root: INode;
    };

    const options: Partial<IMarkmapOptions> = {
      fitRatio: 0.97,
      paddingX: 20,
      nodeMinHeight: 18,
      spacingVertical: 16,
      spacingHorizontal: 120,
      // ⬅️ Expand one more level so ### are open
      initialExpandLevel: 3,
      duration: 300,
    };

    mmRef.current = Markmap.create(svg, options, root);
    const t = setTimeout(() => mmRef.current?.fit(), 0);

    return () => {
      clearTimeout(t);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      mmRef.current = null;
    };
  }, [cleaned]);

  return (
    <div className="w-full overflow-hidden rounded-md border bg-background">
      <svg ref={svgRef} style={{ width: "100%", height }} />
    </div>
  );
}
