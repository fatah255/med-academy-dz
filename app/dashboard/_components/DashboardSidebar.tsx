"use client";

import * as React from "react";
import {
  IconAbc,
  IconCamera,
  IconFileAi,
  IconFileDescription,
  IconHelp,
  IconListDetails,
  IconSettings,
  IconNote,
  IconClipboardList,
  IconBrandGoogleDrive,
  IconGift,
  IconHistory,
  IconBrain,
  IconTimeDuration30,
} from "@tabler/icons-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  // ⬇️ import the hook
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";

const data = {
  navMain: [
    { title: "Courses", url: "/dashboard", icon: IconListDetails },
    { title: "Quizzes", url: "/dashboard/quizzes", icon: IconAbc },
    { title: "Notes", url: "/dashboard/notes", icon: IconNote },
    { title: "Exams", url: "/dashboard/exams", icon: IconClipboardList },
    { title: "AI", url: "/dashboard/ai", icon: IconBrain },
    { title: "History", url: "/dashboard/attempts", icon: IconHistory },
    { title: "Timer", url: "/dashboard/pomodoro", icon: IconTimeDuration30 },
    { title: "Drives", url: "/dashboard/drive", icon: IconBrandGoogleDrive },
    { title: "Free Resources", url: "/dashboard/resources", icon: IconGift },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        { title: "Active Proposals", url: "#" },
        { title: "Archived", url: "#" },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        { title: "Active Proposals", url: "#" },
        { title: "Archived", url: "#" },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        { title: "Active Proposals", url: "#" },
        { title: "Archived", url: "#" },
      ],
    },
  ],
  navSecondary: [
    { title: "Settings", url: "/settings", icon: IconSettings },
    { title: "Get Help", url: "/help", icon: IconHelp },
  ],
};

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar() as {
    isMobile?: boolean;
    setOpen?: (v: boolean) => void;
    setOpenMobile?: (v: boolean) => void;
  };

  // Close the offcanvas sidebar after a link click (only on mobile)
  const closeIfMobile = React.useCallback(() => {
    if (!isMobile) return;
    // small timeout lets Next.js handle the navigation first
    setTimeout(() => {
      setOpenMobile?.(false);
      setOpen?.(false);
    }, 0);
  }, [isMobile, setOpen, setOpenMobile]);

  // Event delegation: any anchor inside the content will close the sidebar
  const onContentClick = React.useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      // ignore new-tab/middle-click/meta/ctrl
      if (e.defaultPrevented) return;
      // @ts-ignore - button exists on MouseEvent in the browser
      if (e.button === 1 || e.ctrlKey || e.metaKey) return;
      closeIfMobile();
    },
    [closeIfMobile]
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="mt-10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 mt-3"
            >
              {/* Close on logo click too (mobile) */}
              <Link href="/" onClick={closeIfMobile}>
                <Image
                  src="/logo.svg"
                  width={20}
                  height={20}
                  alt="logo"
                  className="!size-5"
                />
                <span className="text-base font-semibold">Med Academy</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Capture link clicks inside the nav to close the drawer */}
      <SidebarContent onClickCapture={onContentClick}>
        <NavMain items={data.navMain} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
