// components/mindmap/MindMapCanvas.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Panel,
  Position,
  ReactFlowProvider,
  useReactFlow,
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
  /** height of the canvas; default "540px". Accepts number (px) or any CSS size */
  height?: number | string;
};

function toNodesAndEdges(tree: MindMap) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let idx = 0;
  const nextId = () => String(++idx);

  function walk(n: MindNode, level: number, parentId?: string) {
    const id = nextId();
    nodes.push({
      id,
      data: { label: n.title },
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      style: {
        padding: 10,
        borderRadius: 8,
        background:
          level === 0 ? "#0ea5e9" : level === 1 ? "#10b981" : "#f59e0b",
        color: "#111827",
        border: "1px solid rgba(255,255,255,.15)",
        fontWeight: 600,
      },
    });

    if (parentId) {
      edges.push({
        id: `${parentId}-${id}`,
        source: parentId,
        target: id,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    }

    (n.children ?? []).forEach((c) => walk(c, level + 1, id));
  }

  walk({ title: tree.title, children: tree.children }, 0);

  // simple layered layout
  const levelOf = (id: string, es: Edge[], l = 0): number => {
    const parent = es.find((e) => e.target === id)?.source;
    return parent ? levelOf(parent, es, l + 1) : l;
  };

  const byLevel = new Map<number, Node[]>();
  nodes.forEach((n) => {
    const level = n.id === "1" ? 0 : levelOf(n.id, edges);
    const arr = byLevel.get(level) ?? [];
    arr.push(n);
    byLevel.set(level, arr);
  });

  let y = 0;
  const xGap = 240;
  const yGap = 140;
  [...byLevel.entries()]
    .sort(([a], [b]) => a - b)
    .forEach(([_, arr]) => {
      const totalWidth = (arr.length - 1) * xGap;
      let x = -totalWidth / 2;
      arr.forEach((n) => {
        n.position = { x, y };
        x += xGap;
      });
      y += yGap;
    });

  return { nodes, edges };
}

function Inner({ data, height = 540 }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => toNodesAndEdges(data),
    [data]
  );
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  useEffect(() => {
    const id = setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 0);
    return () => clearTimeout(id);
  }, [nodes.length, fitView]);

  const handleExportPng = async () => {
    if (!wrapperRef.current) return;
    const dataUrl = await toPng(wrapperRef.current, {
      cacheBust: true,
      filter: (node) => {
        const el = node as HTMLElement;
        if (!el) return true;
        const cls = el.classList ?? { contains: () => false };
        if (el.getAttribute?.("data-export-ignore")) return false;
        if (cls.contains("react-flow__controls")) return false;
        if (cls.contains("react-flow__minimap")) return false;
        if (cls.contains("rf-toolbar")) return false;
        return true;
      },
      backgroundColor: "#0b1220",
      pixelRatio: 2,
    });

    const link = document.createElement("a");
    link.download = `mindmap-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const h = typeof height === "number" ? `${height}px` : height ?? "540px";

  return (
    <div
      ref={wrapperRef}
      className="w-full rounded-md border bg-background"
      style={{ height: h }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        fitView
      >
        <Panel
          position="top-left"
          className="rf-toolbar flex gap-2"
          data-export-ignore
        >
          <button
            className="rounded bg-zinc-800 px-2 py-1 text-xs"
            onClick={() => fitView({ padding: 0.2 })}
          >
            Fit View
          </button>
          <button
            className="rounded bg-zinc-800 px-2 py-1 text-xs"
            //@ts-ignore
            onClick={zoomIn}
          >
            +
          </button>
          <button
            className="rounded bg-zinc-800 px-2 py-1 text-xs"
            //@ts-ignore
            onClick={zoomOut}
          >
            –
          </button>
          <button
            className="rounded bg-sky-600 px-2 py-1 text-xs font-medium"
            onClick={handleExportPng}
          >
            Export PNG
          </button>
        </Panel>
        <Controls position="bottom-left" className="export-ignore" />
        {/* @ts-ignore */}
        <Background gap={16} color="rgba(255,255,255,.08)" variant="dots" />
      </ReactFlow>
    </div>
  );
}

export default function MindMapCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
