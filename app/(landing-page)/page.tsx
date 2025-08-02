"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

import { useSession, signOut } from "@/lib/auth-client";

import { redirect, useRouter } from "next/navigation";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };
  return (
    <>
      <ThemeToggle />
      <div>
        {session ? (
          <>
            <p>{session?.user.name}</p>
            <button onClick={handleSignOut}>Sign Out</button>
          </>
        ) : (
          <Button onClick={() => router.push("/login")}>Log In</Button>
        )}
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-4">LANDING PAGE</h1>
      </div>
    </>
  );
}
