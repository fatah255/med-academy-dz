
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

import Logo from "@/public/logo.svg";
import { ThemeToggle } from "./ThemeToggle";
import { buttonVariants } from "@/components/ui/button";
import { UserDropdown } from "./UserDropdown";
import { useSession } from "@/lib/auth-client";

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "Courses", href: "/courses" },
  { name: "Quizzes", href: "/quizzes" },
  { name: "Dashboard", href: "/dashboard" },
];

export function Navbar() {
  const { data: session, isPending } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        aria-label="Global"
        className="
          mx-auto max-w-7xl
          grid items-center gap-2
          grid-cols-[1fr_auto_1fr]
          p-4 md:p-5 lg:px-8
        "
      >
        {/* Left: brand */}
        <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
          <Image
            src={Logo}
            alt="Med Academy"
            className="h-8 w-8 dark:invert"
            priority
          />
          <span className="font-bold">Med Academy</span>
        </Link>

        {/* Center: nav (desktop only) */}
        <div className="hidden lg:flex justify-center gap-x-8">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-semibold text-foreground/90 hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
          {session?.user.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm font-semibold text-foreground/90 hover:text-foreground"
            >
              Admin Panel
            </Link>
          )}
        </div>

        {/* Right: actions (desktop) */}
        <div className="hidden lg:flex justify-end items-center gap-2">
          <ThemeToggle />
          {isPending ? null : session ? (
            <UserDropdown
              name={session.user.name}
              email={session.user.email}
              image={session.user.image}
            />
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Login
              </Link>
              <Link href="/courses" className={buttonVariants({ size: "sm" })}>
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Right: mobile icons (hide center nav on mobile) */}
        <div className="flex items-center justify-end gap-2 lg:hidden col-span-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-foreground"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-50 bg-black/20 dark:bg-black/40" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm sm:border sm:border-border">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="-m-1.5 p-1.5 flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Image src={Logo} alt="Med Academy" className="h-8 w-8 dark:invert" />
              <span className="font-bold">Med Academy</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-foreground"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>

          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-border">
              <div className="space-y-2 py-6">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold hover:bg-muted"
                  >
                    {item.name}
                  </Link>
                ))}
                {session?.user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold hover:bg-muted"
                  >
                    Admin Panel
                  </Link>
                )}
              </div>

              <div className="py-6 flex items-center gap-3">
                {isPending ? null : session ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={buttonVariants({ className: "flex-1" })}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className={buttonVariants({
                        variant: "outline",
                        className: "flex-1",
                      })}
                    >
                      Login
                    </Link>
                    <Link
                      href="/courses"
                      onClick={() => setMobileMenuOpen(false)}
                      className={buttonVariants({ className: "flex-1" })}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>

              <div className="py-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
