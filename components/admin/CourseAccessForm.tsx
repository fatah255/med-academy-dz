// components/admin/CourseAccessForm.tsx
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  grantCoursesToUser,
  findUserWithEnrollments,
} from "@/app/admin/course-access/actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type Course = {
  id: string;
  title: string;
  slug: string;
  price: number;
  level: string;
  status: string;
};

export default function CourseAccessForm({ courses }: { courses: Course[] }) {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [enrollMap, setEnrollMap] = useState<Record<string, string>>({}); // courseId -> status
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [courses, filter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function checkAll(v: boolean) {
    if (v) setSelected(new Set(filtered.map((c) => c.id)));
    else setSelected(new Set());
  }

  function loadUser() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await findUserWithEnrollments(email.trim());
        setUser(res.user);
        const map: Record<string, string> = {};
        for (const e of res.enrollments) map[e.courseId!] = e.status;
        setEnrollMap(map);

        // preselect: only those not already PAID
        const notPaid = courses
          .filter((c) => map[c.id] !== "PAID")
          .map((c) => c.id);
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
      setError("Enter an email and select at least one course.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await grantCoursesToUser({
          email: email.trim(),
          courseIds: ids,
        });
        setMessage(`Updated ${res.updated} enrollment(s).`);
        // refresh enrollments
        const u = await findUserWithEnrollments(email.trim());
        setUser(u.user);
        const map: Record<string, string> = {};
        for (const e of u.enrollments) map[e.courseId!] = e.status;
        setEnrollMap(map);
        // deselect those now PAID
        const remain = ids.filter((id) => map[id] !== "PAID");
        setSelected(new Set(remain));
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grant Course Access</CardTitle>
        <CardDescription>
          Search by email, select courses, then grant access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="filter" className="text-xs text-muted-foreground">
            Filter
          </Label>
          <Input
            id="filter"
            className="max-w-xs"
            placeholder="Search courses…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="selectAll"
                checked={selected.size > 0 && selected.size === filtered.length}
                onCheckedChange={(v) => checkAll(Boolean(v))}
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

        <div className="rounded-md border">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 border-b px-3 py-2 text-xs text-muted-foreground">
            <span></span>
            <span>Course</span>
            <span>Status</span>
            <span>Price</span>
          </div>
          <div className="max-h-[420px] overflow-auto">
            {filtered.map((c) => {
              const status = enrollMap[c.id] ?? "—";
              const paid = status === "PAID";
              return (
                <label
                  key={c.id}
                  className="grid cursor-pointer grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-3 py-2 hover:bg-accent/40"
                >
                  <Checkbox
                    checked={selected.has(c.id)}
                    onCheckedChange={() => toggle(c.id)}
                    disabled={paid}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {c.title}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {c.slug}
                    </div>
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
                  <div className="text-sm tabular-nums">{c.price}</div>
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
