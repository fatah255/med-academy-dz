import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function Home() {
  return (
    <>
      <ThemeToggle />
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-4">LANDING PAGE</h1>
      </div>
    </>
  );
}
