"use client";

import NavbarClient from "@/components/NavbarClient";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarClient />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">{children}</main>
    </>
  );
}
