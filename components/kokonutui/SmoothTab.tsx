"use client";

/**
 * SmoothTab — KokonutUI flavored (mobile-ready + content rendering + counts)
 * https://kokonutui.com  |  MIT
 */

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface TabItem {
  id: string;
  title: string;
  icon?: LucideIcon;
  /** Optional pill count shown in the button */
  count?: number;
  /** Big animated banner/card at the top (optional) */
  cardContent?: React.ReactNode;
  /** Real content rendered below the toolbar */
  content?: React.ReactNode;
  /** Tailwind color classes for the sliding background */
  color: string;
}

const WaveformPath = () => (
  <motion.path
    d="M0 50 C 20 40, 40 30, 60 50 C 80 70, 100 60, 120 50 C 140 40, 160 30, 180 50 C 200 70, 220 60, 240 50 C 260 40, 280 30, 300 50 C 320 70, 340 60, 360 50 C 380 40, 400 30, 420 50 L 420 100 L 0 100 Z"
    initial={false}
    animate={{
      x: [0, 10, 0],
      transition: {
        duration: 5,
        ease: "linear",
        repeat: Number.POSITIVE_INFINITY,
      },
    }}
  />
);

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    filter: "blur(8px)",
    scale: 0.95,
    position: "absolute" as const,
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    position: "absolute" as const,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    filter: "blur(8px)",
    scale: 0.95,
    position: "absolute" as const,
  }),
};
const transition = { duration: 0.4, ease: [0.32, 0.72, 0, 1] };

export default function SmoothTab({
  items,
  defaultTabId,
  className,
  activeColor = "bg-[#1F9CFE]",
  onChange,
}: {
  items: TabItem[];
  defaultTabId?: string;
  className?: string;
  activeColor?: string;
  onChange?: (tabId: string) => void;
}) {
  const firstId = defaultTabId ?? items[0]?.id;
  const [selected, setSelected] = React.useState<string>(firstId);
  const [direction, setDirection] = React.useState(0);
  const [dims, setDims] = React.useState({ width: 0, left: 0 });

  const buttonRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const update = () => {
      const btn = buttonRefs.current.get(selected);
      const container = containerRef.current;
      if (!btn || !container) return;
      const r = btn.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      setDims({ width: r.width, left: r.left - cr.left });
    };
    requestAnimationFrame(update);
    const onResize = () => requestAnimationFrame(update);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [selected]);

  const handleClick = (id: string) => {
    const cur = items.findIndex((it) => it.id === selected);
    const nxt = items.findIndex((it) => it.id === id);
    setDirection(nxt > cur ? 1 : -1);
    setSelected(id);
    onChange?.(id);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    id: string
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(id);
    }
  };

  const selectedItem = items.find((it) => it.id === selected);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Banner / Card area (optional) */}
      {selectedItem?.cardContent && (
        <div className="relative h-[180px] md:h-[200px]">
          <div className="bg-card border rounded-lg h-full w-full relative overflow-hidden">
            <AnimatePresence
              initial={false}
              mode="popLayout"
              custom={direction}
            >
              <motion.div
                key={`card-${selected}`}
                custom={direction}
                variants={slideVariants as any}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition as any}
                className="absolute inset-0 w-full h-full will-change-transform"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                {selectedItem.cardContent}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div
        ref={containerRef}
        role="tablist"
        aria-label="Smooth tabs"
        className={cn(
          "relative mx-auto w-full max-w-[820px] rounded-2xl border bg-background/80 backdrop-blur",
          "px-1 py-1.5",
          "shadow-sm"
        )}
      >
        {/* Sliding background */}
        <motion.div
          className={cn(
            "absolute z-[1] rounded-xl",
            selectedItem?.color || activeColor
          )}
          initial={false}
          animate={{
            width: Math.max(0, dims.width - 8),
            x: Math.max(0, dims.left + 4),
            opacity: 1,
          }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          style={{ height: "calc(100% - 8px)", top: 4 }}
        />
        <div className="relative z-[2] grid grid-cols-2 gap-1 sm:grid-cols-4">
          {items.map((item) => {
            const isSelected = selected === item.id;
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                ref={(el) => {
                  if (el) buttonRefs.current.set(item.id, el);
                  else buttonRefs.current.delete(item.id);
                }}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`panel-${item.id}`}
                id={`tab-${item.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleClick(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                className={cn(
                  "group relative flex items-center justify-center gap-1.5 rounded-xl px-3 py-2",
                  "text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "text-white"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                {Icon && <Icon className="size-4 shrink-0" />}
                <span className="truncate">{item.title}</span>
                {typeof item.count === "number" && (
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full text-[10px]",
                      "bg-muted-foreground/10 text-foreground",
                      "group-aria-selected:text-white/90"
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Actual tab content */}
      <div
        id={`panel-${selectedItem?.id ?? "content"}`}
        role="tabpanel"
        aria-labelledby={`tab-${selectedItem?.id ?? ""}`}
        className="mt-2"
      >
        {selectedItem?.content}
      </div>
    </div>
  );
}
