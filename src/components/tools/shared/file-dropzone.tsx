"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFiles: (files: File[]) => void;
  /** input accept attr, e.g. "application/pdf,image/png" */
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function FileDropzone({
  onFiles,
  accept,
  multiple = false,
  label = "Drop files here",
  hint,
  disabled = false,
  compact = false,
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(multiple ? files : files.slice(0, 1));
    },
    [disabled, multiple, onFiles],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${label} — click or press Enter to browse files`}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current++;
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current--;
        if (dragDepth.current <= 0) setDragging(false);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-all",
        compact ? "gap-1.5 px-4 py-6" : "gap-2.5 px-6 py-10 sm:py-14",
        dragging
          ? "border-primary bg-secondary/70 scale-[1.005]"
          : "border-border bg-card hover:border-primary/50 hover:bg-secondary/30",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-secondary text-secondary-foreground",
          compact ? "h-9 w-9" : "h-12 w-12",
        )}
      >
        <UploadCloud size={compact ? 17 : 22} aria-hidden="true" />
      </span>
      <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
        {dragging ? "Release to add files" : label}
      </p>
      <p className="text-xs text-muted-foreground">
        {hint ?? "Click to browse · drag & drop supported"}
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="pointer-events-none mt-1"
        tabIndex={-1}
        aria-hidden="true"
      >
        Choose Files
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
