"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  courseLevels,
  settingsSchema,
  settingsSchemaType,
} from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { editLevel } from "./actions";
import { useSession } from "@/lib/auth-client";
import { getLevel } from "../courses/actions";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";

const toLabel = (v?: string) =>
  v
    ? v
        .split("_")
        .map((w) => w[0] + w.slice(1).toLowerCase())
        .join(" ")
    : "Select year";

export default function Page() {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const userId = session?.user?.id;

  const form = useForm<settingsSchemaType>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { year: "FIRST_YEAR" }, // temporary until we load real value
  });

  useEffect(() => {
    if (!userId) return;
    let alive = true;

    (async () => {
      try {
        const level = await getLevel(userId); // fetch user level
        if (!alive || !level) return;
        // update the form value AFTER it loads
        form.setValue("year", level, {
          shouldDirty: false,
          shouldValidate: false,
        });
        // or: form.reset({ year: level });
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId, form]);

  async function onSubmit(data: settingsSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(editLevel(data.year));
      if (error) {
        toast.error("Failed to update your year. Please try again.");
        return;
      }
      if (result.status === "success") {
        toast.success("year updated successfully");
      } else if (result.status === "error") {
        toast.error("you have been blocked , try again later");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-5">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Academic Year</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-[200px] justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {toLabel(field.value)}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Select year..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No year found.</CommandEmpty>
                        <CommandGroup>
                          {courseLevels.map((year) => (
                            <CommandItem
                              key={year}
                              value={year}
                              onSelect={() => form.setValue("year", year)}
                            >
                              {toLabel(year)}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  year === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Select the year that you are currently in.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
