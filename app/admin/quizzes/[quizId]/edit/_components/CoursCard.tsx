"use client";

import * as React from "react";
import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronDown, Check, ChevronsUpDown } from "lucide-react";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { cn } from "@/lib/utils";
import { setCoursModule } from "../cours-actions";

export type ModuleOption = { id: string; title: string };

export type AdminGetQuizCoursesCours = {
  id: string;
  title: string;
  quizId: string;
  quizModuleId: string | null;
};

export default function CoursCard({
  cours,
  isUnite,
  modules,
}: {
  cours: AdminGetQuizCoursesCours;
  isUnite: boolean;
  modules: ModuleOption[]; // pass quiz.quizModules here
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isBoxOpen, setIsBoxOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(
    cours.quizModuleId
  );
  const [pending, startTransition] = useTransition();

  const currentLabel =
    modules.find((m) => m.id === selected)?.title ?? "Unassigned";

  const onSelect = (moduleId: string | null) => {
    if (pending) return;
    setSelected(moduleId);
    startTransition(async () => {
      const res = await setCoursModule({
        quizId: cours.quizId,
        coursId: cours.id,
        moduleId,
      });
      if (res.status === "success") {
        toast.success("Module updated");
      } else {
        toast.error(res.message || "Failed to update");
      }
    });
  };

  return (
    <div className="w-full text-foreground text-sm rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="font-medium">{cours.title}</div>

        {isUnite && (
          <div className="flex items-center gap-2">
            <Popover open={isBoxOpen} onOpenChange={setIsBoxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-[220px] justify-between"
                  disabled={pending}
                >
                  <span className="truncate">
                    {pending ? "Saving…" : currentLabel}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[260px] p-0">
                <Command>
                  <CommandInput placeholder="Search module…" className="h-9" />
                  <CommandList>
                    <CommandEmpty>No module found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="__none__"
                        onSelect={() => {
                          setIsBoxOpen(false);
                          onSelect(null); // unassign
                        }}
                      >
                        <span>Unassigned</span>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            selected == null ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                      {modules.map((m) => (
                        <CommandItem
                          key={m.id}
                          value={m.title}
                          onSelect={() => {
                            setIsBoxOpen(false);
                            onSelect(m.id);
                          }}
                        >
                          <span className="truncate">{m.title}</span>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selected === m.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
        <CollapsibleContent>
          <div className="m-4 flex items-center justify-start gap-2 text-sm text-primary">
            <QuestionMarkCircleIcon className="size-5 mr-2 text-muted-foreground" />
            <Link href={`/admin/quizzes/${cours.quizId}/edit/${cours.id}`}>
              Edit {cours.title} quizzes
            </Link>
          </div>
        </CollapsibleContent>

        <div className="text-end">
          <CollapsibleTrigger asChild>
            <Button underlined="dashed" mode="link" size="sm">
              {isOpen ? (
                <ChevronDown className="size-4 rotate-180" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </Collapsible>
    </div>
  );
}
