// app/dashboard/pomodoro/_components/PomodoroClient.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Plus,
  Minus,
  Settings2,
  Bell,
  BellOff,
  ListTodo,
  CheckCircle2,
  Timer as TimerIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

/* ---------- hydration-safe wrapper: NO other hooks here ---------- */
export default function PomodoroClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <PomodoroInner />;
}

/* -------------------- helpers -------------------- */
type Mode = "focus" | "short" | "long";
const DEFAULT_SETTINGS = {
  focusMin: 50,
  shortMin: 10,
  longMin: 25,
  longEvery: 4,
  autoStartWork: true,
  autoStartBreaks: false,
  sounds: true,
  tick: false,
  desktopNotify: true,
};
type Settings = typeof DEFAULT_SETTINGS;

type Task = {
  id: string;
  title: string;
  estimate: number;
  done: boolean;
  completed: number;
};
type HistoryItem = {
  id: string;
  mode: Mode;
  startedAt: number;
  endedAt: number;
  taskId?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const mmssFromMs = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60),
    s = total % 60;
  return `${pad(m)}:${pad(s)}`;
};
const uid = () => Math.random().toString(36).slice(2, 10);
const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
function weekKey(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon=0
  date.setDate(date.getDate() - day);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/* Persisted state hook (safe in client-only inner) */
function usePersistedState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const didHydrateRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setState(JSON.parse(raw) as T);
    } catch {}
    didHydrateRef.current = true;
  }, [key]);

  useEffect(() => {
    if (!didHydrateRef.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  return [state, setState] as const;
}

/* WebAudio beeps */
function playBeep({ freq = 880, dur = 0.18, vol = 0.07 } = {}) {
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.value = vol;
  osc.frequency.value = freq as number;
  osc.type = "sine";
  osc.start();
  setTimeout(() => {
    osc.stop();
    ctx.close();
  }, dur * 1000);
}
function playChime() {
  playBeep({ freq: 1046, dur: 0.12, vol: 0.06 });
  setTimeout(() => playBeep({ freq: 1568, dur: 0.15, vol: 0.06 }), 150);
}

/* -------------------- ALL other hooks go here -------------------- */
function PomodoroInner() {
  const [settings, setSettings] = usePersistedState<Settings>(
    "pomodoro:settings",
    DEFAULT_SETTINGS
  );
  const [mode, setMode] = usePersistedState<Mode>("pomodoro:mode", "focus");
  const [running, setRunning] = usePersistedState<boolean>(
    "pomodoro:running",
    false
  );
  const [cycles, setCycles] = usePersistedState<number>("pomodoro:cycles", 0);
  const [taskId, setTaskId] = usePersistedState<string | null>(
    "pomodoro:activeTask",
    null
  );
  const [tasks, setTasks] = usePersistedState<Task[]>("pomodoro:tasks", []);
  const [history, setHistory] = usePersistedState<HistoryItem[]>(
    "pomodoro:history",
    []
  );

  const baseDuration = useMemo(() => {
    const m =
      mode === "focus"
        ? settings.focusMin
        : mode === "short"
        ? settings.shortMin
        : settings.longMin;
    return m * 60_000;
  }, [mode, settings.focusMin, settings.shortMin, settings.longMin]);

  const [remain, setRemain] = usePersistedState<number>(
    "pomodoro:remain",
    baseDuration
  );

  useEffect(() => {
    if (!running) setRemain(baseDuration);
  }, [baseDuration]); // ok: running in deps not needed for reset

  // timers/refs
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = useRef<number | null>(null);
  const lastSecondRef = useRef<number>(-1);
  const finishSessionRef = useRef<() => void>(() => {});
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const setModeAndReset = useCallback(
    (m: Mode) => {
      setRunning(false);
      clearTimer();
      setMode(m);
      const mns =
        m === "focus"
          ? settings.focusMin
          : m === "short"
          ? settings.shortMin
          : settings.longMin;
      setRemain(mns * 60_000);
    },
    [
      setRunning,
      setMode,
      settings.focusMin,
      settings.shortMin,
      settings.longMin,
      setRemain,
    ]
  );

  const tick = useCallback(() => {
    if (!running) return;
    const now = performance.now();
    if (targetRef.current == null) targetRef.current = now + 1000;
    const ahead = now - (targetRef.current - 1000);

    setRemain((prev) => {
      let next = prev - 1000 - (ahead > 50 ? ahead : 0);
      if (next < 0) next = 0;

      const secondsLeft = Math.round(next / 1000);
      if (settings.tick && secondsLeft !== lastSecondRef.current) {
        lastSecondRef.current = secondsLeft;
        if (secondsLeft > 0) playBeep({ freq: 660, dur: 0.03, vol: 0.03 });
      }

      if (next <= 0) {
        Promise.resolve().then(() => finishSessionRef.current());
      } else {
        targetRef.current = (targetRef.current as number) + 1000;
        timerRef.current = setTimeout(
          tick,
          Math.max(0, (targetRef.current as number) - performance.now())
        );
      }
      return next;
    });
  }, [running, settings.tick]);

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    targetRef.current = null;
    timerRef.current = setTimeout(tick, 1000);
  }, [running, setRunning, tick]);

  const pause = useCallback(() => {
    setRunning(false);
    clearTimer();
  }, [setRunning]);

  const reset = useCallback(() => {
    pause();
    setRemain(baseDuration);
    lastSecondRef.current = -1;
  }, [baseDuration, pause, setRemain]);

  const advanceMode = useCallback<() => Mode>(() => {
    if (mode === "focus") {
      const nextCycles = cycles + 1;
      const next =
        settings.longEvery > 0 && nextCycles % settings.longEvery === 0
          ? "long"
          : "short";
      setCycles(nextCycles);
      return next;
    }
    return "focus";
  }, [cycles, mode, setCycles, settings.longEvery]);

  const finishSession = useCallback(() => {
    pause();
    setRemain(0);
    setHistory((prev) => [
      ...prev,
      {
        id: uid(),
        mode,
        startedAt: Date.now() - baseDuration,
        endedAt: Date.now(),
        taskId: taskId ?? undefined,
      },
    ]);
    if (mode === "focus" && taskId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: t.completed + 1 } : t
        )
      );
    }
    if (settings.sounds) playChime();
    if (
      settings.desktopNotify &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      const title =
        mode === "focus" ? "Time for a break 🎉" : "Back to work 💪";
      const body =
        mode === "focus"
          ? "Great job! Take a short breather."
          : "Focus session is starting.";
      new Notification(title, { body, silent: true });
    }

    const nextMode = advanceMode();
    setMode(nextMode);
    const nextDuration =
      nextMode === "focus"
        ? settings.focusMin
        : nextMode === "short"
        ? settings.shortMin
        : settings.longMin;
    setRemain(nextDuration * 60_000);

    const shouldAutostart =
      nextMode === "focus" ? settings.autoStartWork : settings.autoStartBreaks;
    if (shouldAutostart) setTimeout(() => start(), 350);
  }, [
    pause,
    setRemain,
    setHistory,
    mode,
    baseDuration,
    taskId,
    setTasks,
    settings.sounds,
    settings.desktopNotify,
    advanceMode,
    setMode,
    settings.focusMin,
    settings.shortMin,
    settings.longMin,
    settings.autoStartWork,
    settings.autoStartBreaks,
    start,
  ]);

  useEffect(() => {
    finishSessionRef.current = finishSession;
  }, [finishSession]);
  useEffect(() => () => clearTimer(), []);
  useEffect(() => {
    const label =
      mode === "focus" ? "Focus" : mode === "short" ? "Break" : "Long";
    document.title = `${mmssFromMs(remain)} · ${label}`;
  }, [remain, mode]);
  useEffect(() => {
    if (!settings.desktopNotify || !("Notification" in window)) return;
    if (Notification.permission === "default")
      Notification.requestPermission().catch(() => {});
  }, [settings.desktopNotify]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        running ? pause() : start();
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        finishSessionRef.current();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        reset();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setRemain((v) => v + 60_000);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setRemain((v) => Math.max(0, v - 60_000));
      } else if (e.key === "1") setModeAndReset("focus");
      else if (e.key === "2") setModeAndReset("short");
      else if (e.key === "3") setModeAndReset("long");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pause, reset, running, setRemain, start, setModeAndReset]);

  const stats = useMemo(() => {
    const byToday = history.filter(
      (h) => todayKey(new Date(h.endedAt)) === todayKey()
    );
    const byWeek = history.filter(
      (h) => weekKey(new Date(h.endedAt)) === weekKey()
    );
    const focusMsToday = byToday
      .filter((h) => h.mode === "focus")
      .reduce((a, b) => a + (b.endedAt - b.startedAt), 0);
    const focusMsWeek = byWeek
      .filter((h) => h.mode === "focus")
      .reduce((a, b) => a + (b.endedAt - b.startedAt), 0);
    return {
      todayMin: Math.round(focusMsToday / 60000),
      weekMin: Math.round(focusMsWeek / 60000),
      totalSessions: history.length,
    };
  }, [history]);

  const progress = 1 - Math.max(0, remain) / baseDuration;
  const circumference = 2 * Math.PI * 120;
  const activeTask = tasks.find((t) => t.id === taskId) || null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Timer */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TimerIcon className="h-5 w-5" />
              Pomodoro Timer
            </CardTitle>
            <CardDescription>
              {activeTask ? (
                <>
                  Working on:{" "}
                  <span className="font-medium">{activeTask.title}</span>{" "}
                  <Badge
                    variant="outline"
                    className="ml-1"
                  >{`${activeTask.completed}/${activeTask.estimate}`}</Badge>
                </>
              ) : (
                <>Pick or add a task to stay focused.</>
              )}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ModeChip
              label="Focus"
              active={mode === "focus"}
              onClick={() => setModeAndReset("focus")}
            />
            <ModeChip
              label="Short"
              active={mode === "short"}
              onClick={() => setModeAndReset("short")}
            />
            <ModeChip
              label="Long"
              active={mode === "long"}
              onClick={() => setModeAndReset("long")}
            />
            <SettingsDialog settings={settings} onChange={setSettings} />
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto]">
            {/* Ring */}
            <div className="relative mx-auto aspect-square w-full max-w-[420px]">
              <svg viewBox="0 0 300 300" className="h-full w-full">
                <circle
                  cx="150"
                  cy="150"
                  r="120"
                  className="stroke-muted"
                  strokeWidth="18"
                  fill="none"
                  strokeLinecap="round"
                />
                <motion.circle
                  cx="150"
                  cy="150"
                  r="120"
                  className="stroke-primary"
                  strokeWidth="18"
                  fill="none"
                  strokeLinecap="round"
                  initial={false}
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: circumference * (1 - progress),
                    transformOrigin: "50% 50%",
                    transform: "rotate(-90deg)",
                  }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="text-5xl font-bold tabular-nums md:text-6xl">
                    {mmssFromMs(remain)}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {mode === "focus"
                      ? "Focus"
                      : mode === "short"
                      ? "Short Break"
                      : "Long Break"}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-2 md:items-stretch">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {!running ? (
                  <Button size="lg" onClick={start} className="gap-2">
                    <Play className="h-5 w-5" />
                    Start
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={pause}
                    variant="secondary"
                    className="gap-2"
                  >
                    <Pause className="h-5 w-5" />
                    Pause
                  </Button>
                )}
                <Button variant="outline" onClick={reset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  variant="outline"
                  onClick={() => finishSessionRef.current()}
                  className="gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  Skip
                </Button>
              </div>

              <div className="mt-2 flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setRemain((v) => Math.max(0, v - 60_000))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">± 1 min</span>
                <Button
                  variant="ghost"
                  onClick={() => setRemain((v) => v + 60_000)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-muted-foreground">Cycle</div>
                    <div className="font-medium">
                      {cycles % (settings.longEvery || 1)}/
                      {settings.longEvery || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Stats</div>
                    <div className="font-medium">
                      {stats.todayMin}m today · {stats.weekMin}m this week
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-center text-xs text-muted-foreground">
                Shortcuts: <kbd>Space</kbd> start/pause • <kbd>N</kbd> next •{" "}
                <kbd>R</kbd> reset • <kbd>+</kbd>/<kbd>-</kbd> ±1m •{" "}
                <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd> modes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks + History */}
      <div className="flex flex-col gap-6">
        <TasksCard
          tasks={tasks}
          activeTaskId={taskId}
          onSetActive={setTaskId}
          onChange={setTasks}
        />
        <HistoryCard history={history} />
      </div>
    </div>
  );
}

/* -------------------- UI Pieces -------------------- */
function ModeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "hover:bg-muted/50 text-muted-foreground"
      )}
    >
      {label}
    </button>
  );
}

function SettingsDialog({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Timer Settings</DialogTitle>
          <DialogDescription>
            Customize durations, behavior, and alerts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <TimeSlider
            label="Focus"
            value={settings.focusMin}
            onChange={(v) => onChange({ ...settings, focusMin: v })}
            min={5}
            max={120}
          />
          <TimeSlider
            label="Short break"
            value={settings.shortMin}
            onChange={(v) => onChange({ ...settings, shortMin: v })}
            min={3}
            max={60}
          />
          <TimeSlider
            label="Long break"
            value={settings.longMin}
            onChange={(v) => onChange({ ...settings, longMin: v })}
            min={5}
            max={90}
          />
          <TimeSlider
            label="Long break every"
            value={settings.longEvery}
            onChange={(v) => onChange({ ...settings, longEvery: v })}
            min={2}
            max={10}
            unit="sessions"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ToggleRow
              label="Auto-start work"
              checked={settings.autoStartWork}
              onCheckedChange={(v) =>
                onChange({ ...settings, autoStartWork: v })
              }
            />
            <ToggleRow
              label="Auto-start breaks"
              checked={settings.autoStartBreaks}
              onCheckedChange={(v) =>
                onChange({ ...settings, autoStartBreaks: v })
              }
            />
            <ToggleRow
              label="Session sounds"
              checked={settings.sounds}
              onCheckedChange={(v) => onChange({ ...settings, sounds: v })}
              iconOn={<Bell className="h-4 w-4" />}
              iconOff={<BellOff className="h-4 w-4" />}
            />
            <ToggleRow
              label="Tick every second"
              checked={settings.tick}
              onCheckedChange={(v) => onChange({ ...settings, tick: v })}
            />
            <ToggleRow
              label="Desktop notifications"
              checked={settings.desktopNotify}
              onCheckedChange={(v) =>
                onChange({ ...settings, desktopNotify: v })
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TimeSlider({
  label,
  value,
  onChange,
  min,
  max,
  unit = "min",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm tabular-nums text-muted-foreground">
          {value} {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
  iconOn,
  iconOff,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  iconOn?: React.ReactNode;
  iconOff?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2">
      <div className="flex items-center gap-2">
        {checked ? iconOn : iconOff}
        <span className="text-sm">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

/* Tasks */
function TasksCard({
  tasks,
  activeTaskId,
  onSetActive,
  onChange,
}: {
  tasks: Task[];
  activeTaskId: string | null;
  onSetActive: (id: string | null) => void;
  onChange: (tasks: Task[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [estimate, setEstimate] = useState(1);

  const addTask = () => {
    if (!title.trim()) return;
    onChange([
      ...tasks,
      {
        id: uid(),
        title: title.trim(),
        estimate: Math.max(1, estimate),
        done: false,
        completed: 0,
      },
    ]);
    setTitle("");
    setEstimate(1);
  };

  const setDone = (id: string, value: boolean) =>
    onChange(tasks.map((t) => (t.id === id ? { ...t, done: value } : t)));
  const remove = (id: string) => onChange(tasks.filter((t) => t.id !== id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          Tasks
        </CardTitle>
        <CardDescription>Track what you’ll focus on.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Add a task…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Est.</Label>
            <Input
              type="number"
              min={1}
              value={estimate}
              onChange={(e) => setEstimate(parseInt(e.target.value || "1", 10))}
              className="w-20"
            />
            <Button onClick={addTask}>Add</Button>
          </div>
        </div>

        <div className="space-y-2">
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          )}
          {tasks.map((t) => {
            const isActive = activeTaskId === t.id;
            return (
              <div
                key={t.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
                  isActive && "border-primary/50 bg-primary/5"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={(e) => setDone(t.id, e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span
                      className={cn(
                        "block min-w-0 break-words",
                        t.done && "text-muted-foreground line-through"
                      )}
                    >
                      {t.title}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t.completed}/{t.estimate} pomodoros
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={isActive ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => onSetActive(isActive ? null : t.id)}
                  >
                    {isActive ? "Active" : "Focus"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(t.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* History */
function HistoryCard({ history }: { history: HistoryItem[] }) {
  const byRecent = [...history].reverse().slice(0, 20);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          History
        </CardTitle>
        <CardDescription>Last 20 sessions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {byRecent.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nothing yet—get started!
          </p>
        )}
        {byRecent.map((h) => {
          const durMin = Math.round((h.endedAt - h.startedAt) / 60000);
          return (
            <div
              key={h.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    h.mode === "focus"
                      ? "border-primary text-primary"
                      : h.mode === "short"
                      ? "border-emerald-500 text-emerald-600"
                      : "border-cyan-500 text-cyan-600"
                  )}
                >
                  {h.mode}
                </Badge>
                <span className="text-muted-foreground">
                  {new Date(h.endedAt).toLocaleString()}
                </span>
              </div>
              <span className="tabular-nums">{durMin}m</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
