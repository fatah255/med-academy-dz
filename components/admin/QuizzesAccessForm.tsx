// components/admin/QuizzesAccessForm.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import {
  findUserWithQuizEnrollments,
  grantQuizzesToUser,
} from "@/app/admin/quizzes-access/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Quiz = {
  id: string;
  title: string;
  slug: string;
  price: number;
  level: string; // CourseLevel enum string
  category: string | null;
  status: string;
};

const LEVEL_LABEL: Record<string, string> = {
  FIRST_YEAR: "1st year",
  SECOND_YEAR: "2nd year",
  THIRD_YEAR: "3rd year",
  FOURTH_YEAR: "4th year",
  FIFTH_YEAR: "5th year",
  SIXTH_YEAR: "6th year",
};

export default function QuizzesAccessForm({ quizzes }: { quizzes: Quiz[] }) {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<{
    id: string;
    name: string | null;
    email: string;
  } | null>(null);
  const [enrollMap, setEnrollMap] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [filterText, setFilterText] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("ALL");

  const [billing, setBilling] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [includeAi, setIncludeAi] = useState<boolean>(true);

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const levelOptions = useMemo(() => {
    const levels = new Set(quizzes.map((q) => q.level));
    return ["ALL", ...Array.from(levels)];
  }, [quizzes]);

  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return quizzes.filter((x) => {
      const okLevel = filterLevel === "ALL" || x.level === filterLevel;
      const okText =
        !q ||
        x.title.toLowerCase().includes(q) ||
        x.slug.toLowerCase().includes(q);
      return okLevel && okText;
    });
  }, [quizzes, filterLevel, filterText]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function selectAll(v: boolean) {
    if (v) setSelected(new Set(filtered.map((c) => c.id)));
    else setSelected(new Set());
  }

  function loadUser() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await findUserWithQuizEnrollments(email.trim());
        setUser(res.user);
        const map: Record<string, string> = {};
        for (const e of res.enrollments) map[e.quizId!] = e.status;
        setEnrollMap(map);

        // Preselect quizzes not already PAID
        const notPaid = quizzes
          .filter((q) => map[q.id] !== "PAID")
          .map((q) => q.id);
        setSelected(new Set(notPaid));
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    });
  }

  function grant() {
    setMessage(null);
    setError(null);
    const ids = Array.from(selected);
    if (!email.trim() || ids.length === 0) {
      setError("Enter an email and select at least one quiz.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await grantQuizzesToUser({
          email: email.trim(),
          quizIds: ids,
          billing,
          includeAi,
        });
        setMessage(`Updated ${res.updated} enrollment(s).`);

        const u = await findUserWithQuizEnrollments(email.trim());
        setUser(u.user);
        const map: Record<string, string> = {};
        for (const e of u.enrollments) map[e.quizId!] = e.status;
        setEnrollMap(map);

        // Deselect those now PAID
        const stillNotPaid = ids.filter((id) => map[id] !== "PAID");
        setSelected(new Set(stillNotPaid));
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grant Quizzes Access</CardTitle>
        <CardDescription>
          Filter by year, choose billing period, optionally include AI access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email + Load */}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            placeholder="user@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
          <Button onClick={loadUser} disabled={isPending || !email.trim()}>
            {isPending ? "Loading..." : "Load user"}
          </Button>
        </div>

        {user ? (
          <div className="rounded-md border p-3">
            <p className="text-sm">
              <span className="font-medium">{user.name || "User"}</span>{" "}
              <span className="text-muted-foreground">
                &lt;{user.email}&gt;
              </span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">User not loaded.</p>
        )}

        <Separator />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Year</Label>
            <Select
              value={filterLevel}
              onValueChange={(v) => setFilterLevel(v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((lv) => (
                  <SelectItem key={lv} value={lv}>
                    {lv === "ALL" ? "All years" : LEVEL_LABEL[lv] ?? lv}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              className="w-[220px]"
              placeholder="Title or slug…"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Billing</Label>
            <Select value={billing} onValueChange={(v) => setBilling(v as any)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly (1 month)</SelectItem>
                <SelectItem value="YEARLY">Yearly (12 months)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="ml-2 flex items-center gap-2">
            <Checkbox
              id="aiAccess"
              checked={includeAi}
              onCheckedChange={(v) => setIncludeAi(Boolean(v))}
            />
            <Label htmlFor="aiAccess">Include AI access</Label>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="selectAll"
                checked={selected.size > 0 && selected.size === filtered.length}
                onCheckedChange={(v) => selectAll(Boolean(v))}
              />
              <Label htmlFor="selectAll" className="text-sm">
                Select all (filtered)
              </Label>
            </div>
            <Button
              onClick={grant}
              disabled={isPending || !user || selected.size === 0}
            >
              {isPending ? "Saving..." : "Grant access"}
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="rounded-md border">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 border-b px-3 py-2 text-xs text-muted-foreground">
            <span></span>
            <span>Quiz</span>
            <span>Year</span>
            <span>Status</span>
            <span>Price</span>
          </div>
          <div className="max-h-[460px] overflow-auto">
            {filtered.map((q) => {
              const status = enrollMap[q.id] ?? "—";
              const paid = status === "PAID";
              return (
                <label
                  key={q.id}
                  className="grid cursor-pointer grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-3 py-2 hover:bg-accent/40"
                >
                  <Checkbox
                    checked={selected.has(q.id)}
                    onCheckedChange={() => toggle(q.id)}
                    disabled={paid}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {q.title}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {q.slug}
                    </div>
                  </div>
                  <div className="text-sm">
                    {LEVEL_LABEL[q.level] ?? q.level}
                  </div>
                  <div>
                    {paid ? (
                      <Badge variant="default">PAID</Badge>
                    ) : status === "PENDING" ? (
                      <Badge variant="secondary">PENDING</Badge>
                    ) : (
                      <Badge variant="outline">NONE</Badge>
                    )}
                  </div>
                  <div className="text-sm tabular-nums">{q.price}</div>
                </label>
              );
            })}
          </div>
        </div>

        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
