import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center">
      <Link
        className={buttonVariants({
          variant: "outline",
          className: "absolute left-4 top-4",
        })}
        href="/"
      >
        <ArrowLeft />
        Go Back
      </Link>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          className="flex items-center gap-2 self-center font-medium"
          href="/"
        >
          <Image
            src="/logo.svg"
            className="dark:invert"
            alt="Med Academy DZ"
            width={32}
            height={32}
          />
          Med Academy DZ
        </Link>
        {children}
        <div className="text-balance text-center text-xs text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <span className="hover:text-primary hover:underline">terms</span> and{" "}
          <span className="hover:text-primary hover:underline">
            privacy policy
          </span>
        </div>
      </div>
    </div>
  );
}
