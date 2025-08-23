// app/(your-course-route)/_components/MobileSyllabusSheet.tsx
"use client";

import { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function MobileSyllabusSheet({
  children, // <- server component comes in here
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="shrink-0">
          <Menu className="mr-2 h-4 w-4" />
          Syllabus
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 p-0">
        {/* a11y: Radix requires a title */}
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="text-base">Course syllabus</SheetTitle>
        </SheetHeader>

        {/* make the sidebar scrollable inside the drawer */}
        <div className="overflow-y-auto">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
