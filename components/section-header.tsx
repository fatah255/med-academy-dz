// components/section-header.tsx
import { ReactNode } from "react";

export default function SectionHeader({
  icon,
  title,
  className = "",
}: {
  icon?: ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={`mb-4 rounded-xl bg-muted/60 px-4 py-3 text-sm font-medium text-muted-foreground flex items-center gap-2 ${className}`}
    >
      <span className="inline-flex items-center justify-center rounded-lg bg-primary/10 text-primary p-1.5">
        {icon}
      </span>
      <span>{title}</span>
    </div>
  );
}
