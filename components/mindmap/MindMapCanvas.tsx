"use client";

import React, { useEffect, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  Panel,
  Position,
  ReactFlowProvider,
  type Edge,
  type Node,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { toPng } from "html-to-image";

type MindNode = { title: string; note?: string; children?: MindNode[] };
type MindMap = { title: string; children?: MindNode[] };

type Props = {
  data: MindMap;
  height?: number | string;
};

function MindMapCanvasInner({ data, height = 540 }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ---- configurable look & spacing ----
  const xGap = 220; // distance between levels (x)
  const yGap = 64; // distance between siblings (y)
  const rootColor = "#3b82f6";
  const level1Color = "#10b981";
  const level2Color = "#f59e0b";
  const branchPalette = [
    "#22c55e",
    "#f97316",
    "#06b6d4",
    "#a78bfa",
    "#ef4444",
    "#eab308",
  ];

  // Build graph (nodes + edges) and compute a tidy left→right layout
  const { nodes, edges } = useMemo(() => {
    let id = 0;
    const nextId = () => String(++id);

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const childrenMap = new Map<string, string[]>();

    // store each node’s level & “top branch index” (for consistent edge color)
    const meta: Record<string, { level: number; branchIdx?: number }> = {};

    function walk(
      n: MindNode,
      level: number,
      parentId?: string,
      branchIdx?: number
    ): string {
      const nodeId = nextId();
      meta[nodeId] = { level, branchIdx };

      nodes.push({
        id: nodeId,
        data: { label: n.title },
        position: { x: 0, y: 0 }, // filled later
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,.18)",
          fontSize: 12,
          fontWeight: 600,
          background:
            level === 0 ? rootColor : level === 1 ? level1Color : level2Color,
          color: "#0b1220",
          boxShadow: "0 0 0 1px rgba(0,0,0,.08) inset",
          whiteSpace: "nowrap",
        },
      });

      if (parentId) {
        const topIdx = branchIdx ?? meta[parentId].branchIdx ?? 0;
        const stroke = branchPalette[topIdx % branchPalette.length];
        edges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: "bezier",
          markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
          style: { stroke, strokeWidth: 2.2, opacity: 0.9 },
        });
      }

      const kids = n.children ?? [];
      if (kids.length) {
        childrenMap.set(nodeId, []);
        kids.forEach((child, index) => {
          const childId = walk(
            child,
            level + 1,
            nodeId,
            // the first level under the root determines branch color
            level === 0 ? index : branchIdx ?? 0
          );
          childrenMap.get(nodeId)!.push(childId);
        });
      }

      return nodeId;
    }

    const rootId = walk(
      { title: data.title, children: data.children ?? [] },
      0
    );

    // ---- tidy layout (parent centered above children, leaves evenly spaced)
    const pos = new Map<string, { x: number; y: number }>();
    let nextLeafRow = 0;

    function place(id: string, depth: number): number {
      const children = childrenMap.get(id) ?? [];
      if (children.length === 0) {
        const y = nextLeafRow * yGap;
        nextLeafRow++;
        pos.set(id, { x: depth * xGap, y });
        return y;
      }

      const ys = children.map((cid) => place(cid, depth + 1));
      const y = (Math.min(...ys) + Math.max(...ys)) / 2;
      pos.set(id, { x: depth * xGap, y });
      return y;
    }

    place(rootId, 0);

    nodes.forEach((n) => {
      const p = pos.get(n.id)!;
      n.position = p;
    });

    return { nodes, edges };
  }, [JSON.stringify(data)]);

  // Fit once after first paint
  useEffect(() => {
    // small delay to let RF mount
    const t = setTimeout(() => {
      const evt = new Event("fitview");
      window.dispatchEvent(evt);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Fit-view dispatcher (ReactFlow has no imperative handle without hooks here)
  useEffect(() => {
    const handler = () => {
      const canvas = document.querySelector(
        ".react-flow__viewport"
      ) as HTMLElement | null;
      if (!canvas) return;
      // simulate Ctrl+0 by calling the internal fitView button via ref
      const btn = document.querySelector(
        "[data-mm-fit]"
      ) as HTMLButtonElement | null;
      btn?.click();
    };
    window.addEventListener("fitview", handler);
    return () => window.removeEventListener("fitview", handler);
  }, []);

  const h = typeof height === "number" ? `${height}px` : height ?? "540px";

  const exportPng = async () => {
    if (!wrapperRef.current) return;
    const isDark = document.documentElement.classList.contains("dark");
    const bg = isDark ? "#0b1220" : "#ffffff";

    const dataUrl = await toPng(wrapperRef.current, {
      cacheBust: true,
      backgroundColor: bg,
      pixelRatio: 2,
      filter: (node) => {
        const el = node as HTMLElement;
        if (!el) return true;
        // ignore controls / toolbar
        if (el.getAttribute("data-export-ignore") === "true") return false;
        if (el.classList?.contains("react-flow__controls")) return false;
        return true;
      },
    });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `mindmap-${Date.now()}.png`;
    link.click();
  };

  return (
    <div
      ref={wrapperRef}
      className="w-full rounded-md border"
      style={{ height: h, background: "transparent" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        panOnScroll
        fitView
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Panel
          position="top-left"
          className="rf-toolbar flex gap-2"
          data-export-ignore
        >
          <button
            data-mm-fit
            className="rounded bg-zinc-800 px-2 py-1 text-xs text-white"
            onClick={() => {
              // ReactFlow exposes fitView via internal event; trigger by changing size
              const evt = new Event("fitview");
              window.dispatchEvent(evt);
            }}
          >
            Fit View
          </button>
          <button
            className="rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white"
            onClick={exportPng}
          >
            Export PNG
          </button>
        </Panel>
        <Controls position="bottom-left" data-export-ignore />
        {/* subtle dotted bg to match your screenshot */}
        {/* @ts-ignore */}
        <Background gap={32} color="rgba(255,255,255,.08)" variant="dots" />
      </ReactFlow>
    </div>
  );
}

export default function MindMapCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <MindMapCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
