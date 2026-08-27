"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle, ArrowDown, ArrowUp, Check, CheckCircle2, Download, Loader2, RotateCcw, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "./file-dropzone";
import { formatBytes, safeBaseName, truncateMiddle } from "@/lib/format";
import { validateFile, type SniffedType, type ValidateOptions } from "@/lib/file-validate";
import { trackToolUse } from "@/lib/track";
import { pushRecent } from "@/hooks/use-local-tools";
import { cn } from "@/lib/utils";
import { saveZip, type ZipEntry } from "@/lib/download";

/* ------------------------------ File management --------------------------- */

export interface ManagedFile {
  id: string;
  file: File;
  type: SniffedType;
  previewUrl?: string;
}

export function useFileQueue(validateOpts: ValidateOptions, opts: { images?: boolean; multiple?: boolean } = {}) {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    async (incoming: File[]) => {
      setError(null);
      const accepted: ManagedFile[] = [];
      for (const file of incoming) {
        const result = await validateFile(file, validateOpts);
        if (!result.ok) {
          setError(result.error ?? "One file could not be added.");
          continue;
        }
        accepted.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          type: result.type,
          previewUrl: opts.images ? URL.createObjectURL(file) : undefined,
        });
      }
      if (accepted.length) {
        setFiles((prev) => (opts.multiple === false ? accepted.slice(0, 1) : [...prev, ...accepted]));
      }
    },
    [validateOpts, opts.images, opts.multiple],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const moveFile = useCallback((id: string, direction: -1 | 1) => {
    setFiles((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
      return [];
    });
    setError(null);
  }, []);

  return { files, setFiles, addFiles, removeFile, moveFile, clear, error, setError };
}

export function FileListRow({
  item,
  onRemove,
  onMoveUp,
  onMoveDown,
  showOrder = false,
}: {
  item: ManagedFile;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showOrder?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5">
      {item.previewUrl ? (
         
        <img src={item.previewUrl} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-[10px] font-bold uppercase text-secondary-foreground">
          {item.type === "pdf" ? "PDF" : item.file.name.split(".").pop()?.slice(0, 4) ?? "FILE"}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {showOrder ? null : null}
          {truncateMiddle(item.file.name, 42)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(item.file.size)}
          {item.type !== "unknown" ? ` · ${item.type.toUpperCase()}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-0.5">
        {onMoveUp && (
          <button type="button" onClick={onMoveUp} aria-label={`Move ${item.file.name} up`} className="focus-ring rounded-md p-1.5 text-muted-foreground hover:text-foreground">
            <ArrowUp size={14} />
          </button>
        )}
        {onMoveDown && (
          <button type="button" onClick={onMoveDown} aria-label={`Move ${item.file.name} down`} className="focus-ring rounded-md p-1.5 text-muted-foreground hover:text-foreground">
            <ArrowDown size={14} />
          </button>
        )}
        <button type="button" onClick={onRemove} aria-label={`Remove ${item.file.name}`} className="focus-ring rounded-md p-1.5 text-muted-foreground hover:text-destructive">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ Processing UI ------------------------------ */

export type WorkflowStatus = "idle" | "reading" | "processing" | "finishing" | "done" | "error";

export interface WorkflowResult {
  filename: string;
  blob: Blob;
  originalSize?: number;
  extra?: React.ReactNode;
}

const STEP_LABELS: Record<string, string> = {
  reading: "Reading files…",
  processing: "Processing…",
  finishing: "Preparing download…",
};

export function ProcessingStatus({ status, stepLabel }: { status: WorkflowStatus; stepLabel?: string }) {
  if (status === "idle" || status === "done") return null;
  const order: WorkflowStatus[] = ["reading", "processing", "finishing"];
  const activeIndex = order.indexOf(status);
  return (
    <div className="rounded-xl border bg-card p-4" role="status" aria-live="polite">
      <ol className="space-y-2.5">
        {order.map((step, i) => {
          const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
          return (
            <li key={step} className="flex items-center gap-2.5 text-sm">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border",
                  state === "done" && "border-success bg-success text-success-foreground",
                  state === "active" && "animate-pulse border-primary bg-secondary text-primary",
                  state === "pending" && "border-border text-muted-foreground/40",
                )}
              >
                {state === "done" ? <Check size={11} /> : state === "active" ? <Loader2 size={11} className="animate-spin" /> : null}
              </span>
              <span className={cn(state === "pending" ? "text-muted-foreground/50" : "text-foreground")}>
                {(stepLabel && step === "processing" ? stepLabel : STEP_LABELS[step]) ?? "Working…"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ErrorPanel({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <AlertCircle className="mt-0.5 shrink-0 text-destructive" size={18} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-destructive">{message}</p>
        <p className="mt-1 text-xs text-muted-foreground">Your files stay on your device — nothing was uploaded.</p>
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="focus-ring rounded-md p-1 text-muted-foreground hover:text-foreground">
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export function ResultPanel({
  result,
  additionalResults,
  onReset,
  zipName,
}: {
  result: WorkflowResult;
  additionalResults?: { name: string; blob: Blob }[];
  onReset: () => void;
  zipName?: string;
}) {
  const handleDownload = () => {
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeBaseName(result.filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const downloadAll = async () => {
    const entries: ZipEntry[] = [{ name: result.filename, blob: result.blob }];
    for (const extra of additionalResults ?? []) entries.push({ name: extra.name, blob: extra.blob });
    await saveZip(entries, zipName ?? "pixelmint-files.zip");
  };

  return (
    <div className="rounded-2xl border border-success/30 bg-success/5 p-5 sm:p-6" role="status">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-success-foreground">
          <CheckCircle2 size={17} />
        </span>
        <p className="font-semibold text-foreground">Your file is ready</p>
      </div>

      {result.originalSize !== undefined && result.originalSize > 0 && (
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-card/70 px-2 py-2.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Original</dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">{formatBytes(result.originalSize)}</dd>
          </div>
          <div className="rounded-lg bg-card/70 px-2 py-2.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">New size</dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">{formatBytes(result.blob.size)}</dd>
          </div>
          <div className="rounded-lg bg-card/70 px-2 py-2.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Saved</dt>
            <dd className="mt-0.5 text-sm font-semibold text-success">
              {Math.max(0, (1 - result.blob.size / result.originalSize) * 100).toFixed(1)}%
            </dd>
          </div>
        </dl>
      )}

      {result.extra}

      <div className="mt-4 flex flex-wrap gap-2.5">
        <Button onClick={handleDownload} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Download size={15} className="mr-1.5" aria-hidden="true" />
          Download {result.filename.split(".").pop()?.toUpperCase() ?? "file"}
        </Button>
        {additionalResults && additionalResults.length > 0 && (
          <Button variant="outline" onClick={downloadAll}>
            <Download size={15} className="mr-1.5" aria-hidden="true" />
            Download all as ZIP ({additionalResults.length + 1})
          </Button>
        )}
        <Button variant="ghost" onClick={onReset}>
          <RotateCcw size={15} className="mr-1.5" aria-hidden="true" />
          Start Again
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------ Workflow hook ------------------------------ */

export function useToolWorkflow(slug: string) {
  const [status, setStatus] = useState<WorkflowStatus>("idle");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [additional, setAdditional] = useState<{ name: string; blob: Blob }[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (task: () => Promise<WorkflowResult | { result: WorkflowResult; additional: { name: string; blob: Blob }[] }>) => {
      if (status === "reading" || status === "processing" || status === "finishing") return;
      setStatus("reading");
      setError(null);
      setResult(null);
      setAdditional(undefined);
      pushRecent(slug);
      // let the UI paint the first step
      await new Promise((r) => setTimeout(r, 30));
      try {
        setStatus("processing");
        const output = await task();
        setStatus("finishing");
        await new Promise((r) => setTimeout(r, 80));
        if ("result" in output && "additional" in output) {
          setResult(output.result);
          setAdditional(output.additional);
        } else {
          setResult(output);
        }
        setStatus("done");
        trackToolUse(slug, "success");
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : "We couldn't process this file. Please try again.";
        setError(message);
        setStatus("error");
        trackToolUse(slug, "error");
      }
    },
    [slug, status],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setAdditional(undefined);
    setError(null);
  }, []);

  return { status, result, additional, error, run, reset, setError, busy: status === "reading" || status === "processing" || status === "finishing" };
}

/** Shared friendly error mapper for tool errors. */
export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (/password/i.test(msg)) return "This PDF is password protected. Unlock it first, then try again.";
  if (/encrypted/i.test(msg)) return "This PDF is encrypted. Use the Unlock PDF tool first.";
  if (/not a (valid )?pdf|format/i.test(msg)) return "This file doesn't look like a valid PDF.";
  if (/decode|corrupt/i.test(msg)) return "We couldn't read this file — it may be corrupted.";
  if (/memory|allocation/i.test(msg)) return "This file is too large to process in your browser. Try a smaller file.";
  if (/network|fetch/i.test(msg)) return "A network error occurred. Check your connection and try again.";
  return "We couldn't process this file. Please try again.";
}

export { FileDropzone, toast };
