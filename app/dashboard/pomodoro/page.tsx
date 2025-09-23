// app/dashboard/pomodoro/page.tsx

import Pomodoro from "./_components/Pomodoro";

export default function Page() {
  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/40">
      <div className="container mx-auto max-w-6xl py-8 md:py-10">
        <h1 className="mb-6 text-center text-2xl font-semibold md:text-3xl">
          Pomodoro
        </h1>
        <Pomodoro />
      </div>
    </div>
  );
}
