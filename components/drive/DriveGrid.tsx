"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink, Link2, Copy, Check } from "lucide-react";

type Item = {
  name: string;
  type: "MODULE" | "UNITE";
  icon?: string;
  link: string; // may be empty
};

export default function DriveGrid({ items }: { items: Item[] }) {
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const arr = s
      ? items.filter((i) => `${i.name} ${i.type}`.toLowerCase().includes(s))
      : items;

    // group: UNITE first, then MODULE
    return [
      ...arr.filter((i) => i.type === "UNITE"),
      ...arr.filter((i) => i.type === "MODULE"),
    ];
  }, [items, q]);

  const handleCopy = async (name: string, link: string) => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(name);
      setTimeout(() => setCopied(null), 1400);
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Rechercher un module / une unité…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full sm:w-80"
        />
        <div className="text-sm text-muted-foreground">
          {filtered.length} élément{filtered.length > 1 ? "s" : ""}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucun résultat. Essayez un autre mot-clé.
          </CardContent>
        </Card>
      ) : (
        <TooltipProvider delayDuration={150}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const hasLink = /^https?:\/\//i.test(item.link);
              return (
                <Card
                  key={item.name}
                  className="group overflow-hidden border bg-card transition hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-xl">
                          {item.icon ?? "📁"}
                        </div>
                        <div>
                          <CardTitle className="text-base leading-tight">
                            {item.name}
                          </CardTitle>
                          <Badge
                            variant={
                              item.type === "UNITE" ? "default" : "secondary"
                            }
                            className="mt-1"
                          >
                            {item.type === "UNITE" ? "Unité" : "Module"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-2">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            disabled={!hasLink}
                            asChild={hasLink}
                          >
                            {hasLink ? (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Ouvrir le Drive
                              </a>
                            ) : (
                              <span className="inline-flex w-full items-center justify-center gap-2">
                                <Link2 className="h-4 w-4" />
                                Bientôt
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {hasLink
                            ? "Ouvrir le dossier Google Drive"
                            : "Lien non disponible"}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(item.name, item.link)}
                            disabled={!hasLink}
                          >
                            {copied === item.name ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {hasLink ? "Copier le lien" : "Lien indisponible"}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* subtle hint */}
                    {hasLink ? (
                      <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                        {item.link}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground italic">
                        Aucun lien fourni pour le moment.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
