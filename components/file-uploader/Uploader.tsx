"use client";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import { RenderEmptyState } from "./RenderState";

const Uploader = () => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Do something with the files
    console.log(acceptedFiles);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  return (
    <Card
      className={cn(
        "relative border-dashed border-2 border-gray-300 p-4 transition-colors duration-200 ease-in-out w-full h-64",
        isDragActive
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary"
      )}
      {...getRootProps()}
    >
      <CardContent className="flex items-center justify-center h-full">
        <input {...getInputProps()} />
        <RenderEmptyState isDragActive={isDragActive} />
        <p className="text-base font-semibold text-foreground font-bold ">
          Drop your files here or{" "}
          <span className="text-primary cursor-pointer">click to upload</span>
        </p>
      </CardContent>
    </Card>
  );
};

export default Uploader;
