// app/(dashboard)/dashboard/layout.tsx
"use client";

import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./_components/DashboardSidebar";
import { SiteHeader } from "@/components/site-header";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "15rem",
          "--header-height": "3.25rem",
        } as React.CSSProperties
      }
    >
      <DashboardSidebar variant="inset" />
      <SidebarInset className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 h-[var(--header-height)] border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SiteHeader />
        </header>

        {/* give your pages their own padding/max width if you want */}
        <div className="px-4 pt-4 pb-10 sm:px-6 lg:px-8 lg:pt-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
