// app/dashboard/exams/_components/filters-toolbar.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandInput,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  total: number;
  categoryOptions: string[];
};

const YEARS = [1, 2, 3, 4, 5, 6] as const;

export default function FiltersToolbar({ total, categoryOptions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const q = sp.get("q") ?? "";
  const categories = sp.getAll("category");
  const years = sp.getAll("year").map((x) => Number(x));
  const sort = sp.get("sort") ?? "new";

  const [search, setSearch] = useState(q);

  function setParam(key: string, value?: string | string[]) {
    const params = new URLSearchParams(sp.toString());
    if (Array.isArray(value)) {
      params.delete(key);
      value.forEach((v) => params.append(key, v));
    } else if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleMulti(key: string, val: string) {
    const curr = sp.getAll(key);
    const next = curr.includes(val)
      ? curr.filter((v) => v !== val)
      : [...curr, val];
    setParam(key, next);
  }

  function clearAll() {
    router.push(pathname);
  }

  const activeCount = useMemo(
    () =>
      (q ? 1 : 0) + categories.length + years.length + (sort !== "new" ? 1 : 0),
    [q, categories, years, sort]
  );

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", search.trim() ? search.trim() : undefined);
          }}
          className="flex-1 min-w-[220px]"
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exams…"
          />
        </form>

        {/* Categories multi-select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Filter className="h-4 w-4" />
              Categories
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0">
            <Command>
              <CommandInput placeholder="Filter categories…" />
              <CommandGroup>
                {categoryOptions.map((c) => {
                  const active = categories.includes(c);
                  return (
                    <CommandItem
                      key={c}
                      value={c}
                      onSelect={() => toggleMulti("category", c)}
                      className="flex items-center justify-between"
                    >
                      <span>{c}</span>
                      {active ? (
                        <Badge variant="outline">Selected</Badge>
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Years chips */}
        <div className="hidden md:flex gap-1">
          {YEARS.map((y) => {
            const active = years.includes(y);
            return (
              <Button
                key={y}
                size="sm"
                variant={active ? null : "outline"}
                onClick={() => toggleMulti("year", String(y))}
              >
                Y{y}
              </Button>
            );
          })}
        </div>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Newest</SelectItem>
            <SelectItem value="old">Oldest</SelectItem>
            <SelectItem value="title">Title A–Z</SelectItem>
          </SelectContent>
        </Select>

        <Separator
          orientation="vertical"
          className="mx-1 h-6 hidden md:block"
        />
        <div className="ml-auto flex items-center gap-2">
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear ({activeCount})
            </Button>
          )}
          <div className="text-xs text-muted-foreground">{total} results</div>
        </div>
      </div>

      {/* Active chips */}
      {(categories.length || years.length || q) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {q ? (
            <Badge variant="outline" className="gap-1">
              q: “{q}”
              <button onClick={() => setParam("q", undefined)}>
                <X className="ml-1 h-3 w-3" />
              </button>
            </Badge>
          ) : null}

          {categories.map((c) => (
            <Badge key={c} variant="outline" className="gap-1">
              {c}
              <button onClick={() => toggleMulti("category", c)}>
                <X className="ml-1 h-3 w-3" />
              </button>
            </Badge>
          ))}

          {years.map((y) => (
            <Badge key={y} variant="outline" className="gap-1">
              Y{y}
              <button onClick={() => toggleMulti("year", String(y))}>
                <X className="ml-1 h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
