// components/tiles.tsx
"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconChevronRight,
  IconFolder,
  IconCube,
  IconFileText,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils"; // if you don't have this, replace cn(...) with string templates
import Image from "next/image";

export function UniteTile({
  id,
  title,
  description,
  href = `/dashboard/resources/units/${id}`,
}: {
  id: string;
  title: string;
  description?: string | null;
  href?: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="group border-muted/60 hover:border-primary/40 transition-colors">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="rounded-xl bg-primary/10 text-primary p-2">
            <IconFolder className="size-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">{title}</p>
              <IconChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CircleIconImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-8 w-8 rounded-full overflow-hidden ring-1 ring-primary/20 bg-muted">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="32px"
        className="object-cover"
        // remove if you've configured next.config images remotePatterns/domains
        unoptimized
      />
    </div>
  );
}

function RenderIcon({ icon, title }: { icon?: string | null; title: string }) {
  if (!icon) return <IconCube className="size-6" />;

  // URL → crop inside a circle
  if (/^https?:\/\//i.test(icon)) {
    return <CircleIconImage src={icon} alt={`${title} icon`} />;
  }

  // Emoji → center inside a circle
  if (/\p{Extended_Pictographic}/u.test(icon)) {
    return (
      <div className="h-8 w-8 rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
        <span className="text-lg leading-none">{icon}</span>
      </div>
    );
  }

  // Fallback
  return <IconCube className="size-6" />;
}
export function ModuleTile({
  id,
  title,
  description,
  iconEmoji,
  href = `/dashboard/resources/modules/${id}`,
  footerCount,
  footerLabel = "courses",
}: {
  id: string;
  title: string;
  description?: string | null;
  iconEmoji?: string | null;
  href?: string;
  footerCount?: number;
  footerLabel?: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="group border-muted/60 hover:border-primary/40 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 text-primary p-2">
              <RenderIcon icon={iconEmoji} title={title} />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{title}</p>
                <IconChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              {description ? (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {description}
                </p>
              ) : null}

              {typeof footerCount === "number" ? (
                <Badge variant="secondary" className="mt-3">
                  {footerCount} {footerLabel}
                </Badge>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
export function LessonTile({
  id,
  title,
  description,
  href = `/dashboard/resources/lessons/${id}`,
}: {
  id: string;
  title: string;
  description?: string | null;
  href?: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="group border-muted/60 hover:border-primary/40 transition-colors">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="rounded-xl bg-primary/10 text-primary p-2">
            <IconFileText className="size-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">{title}</p>
              <IconChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
