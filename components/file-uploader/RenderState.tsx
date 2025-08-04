"use client";

import { cn } from "@/lib/utils";
import { CloudUploadIcon, ImageIcon } from "lucide-react";

export const RenderEmptyState = ({
  isDragActive,
}: {
  isDragActive: boolean;
}) => {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center h-16 w-16 mx-auto mb-2">
        <CloudUploadIcon
          className={cn(
            "size-6 text-muted-foreground",
            isDragActive && "text-primary"
          )}
        />
      </div>
    </div>
  );
};

export const ErrorState = () => {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center bg-destructive/30   h-16 w-16 mx-auto mb-2">
        <ImageIcon className={cn("size-6 text-destructive")} />
      </div>
      <p className="text-base font-semibold">
        An error occurred while uploading files.
      </p>
      <p className="text-sm text-muted-foreground">Please try again</p>
    </div>
  );
};
