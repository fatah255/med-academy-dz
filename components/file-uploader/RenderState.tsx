"use client";

import { cn } from "@/lib/utils";
import { CloudUploadIcon, ImageIcon, Loader2, XIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

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

export const RenderUploadedState = ({
  previewUrl,
  isDeleting,
  handleRemoveFile,
  fileType,
}: {
  previewUrl: string;
  isDeleting: boolean;
  handleRemoveFile: () => void;
  fileType: "image" | "video";
}) => {
  return (
    <div className="relative w-full h-full group flex items-center justify-center">
      {fileType === "image" ? (
        <Image
          src={previewUrl}
          alt="Uploaded file"
          fill
          className="object-contain p-2"
        />
      ) : (
        <video src={previewUrl} controls className="rounded-md w-full h-full" />
      )}
      <Button
        onClick={handleRemoveFile}
        disabled={isDeleting}
        variant="destructive"
        size="icon"
        className={cn("absolute top-4 right-4")}
      >
        {isDeleting ? (
          <Loader2 className="animate-spin size-4" />
        ) : (
          <XIcon className="size-4" />
        )}
      </Button>
    </div>
  );
};

export const RenderUploadingState = ({
  progress,
  file,
}: {
  progress: number;
  file: File;
}) => {
  return (
    <div className="text-center flex items-center justify-center flex-col">
      <p>{progress}</p>
      <p className="mt-2 text-sm font-medium text-foreground truncate max-w-xs">
        Uploading {file.name}...
      </p>
      <progress value={progress} max={100} />
    </div>
  );
};
