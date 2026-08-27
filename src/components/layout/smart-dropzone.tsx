"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileSearch, Sparkles, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Smart drop zone: drop any file and get instant suggestions for the
 * Pixelmint.fun tools that can handle it. Nothing is uploaded — the
 * file never leaves the browser; we only read its name and type.
 */

type Suggestion = { slug: string; name: string };

const SUGGESTIONS: Record<string, Suggestion[]> = {
  pdf: [
    { slug: "merge-pdf", name: "Merge PDF" },
    { slug: "compress-pdf", name: "Compress PDF" },
    { slug: "split-pdf", name: "Split PDF" },
    { slug: "pdf-to-word", name: "PDF to Word" },
    { slug: "pdf-to-jpg", name: "PDF to JPG" },
  ],
  image: [
    { slug: "image-compressor", name: "Image Compressor" },
    { slug: "image-resizer", name: "Image Resizer" },
    { slug: "background-remover", name: "Remove Background" },
    { slug: "image-converter", name: "Convert Format" },
    { slug: "jpg-to-png", name: "JPG to PNG" },
  ],
  word: [
    { slug: "word-to-pdf", name: "Word to PDF" },
    { slug: "word-counter", name: "Word Counter" },
  ],
  excel: [{ slug: "excel-to-pdf", name: "Excel to PDF" }],
  powerpoint: [{ slug: "ppt-to-pdf", name: "PPT to PDF" }],
  zip: [{ slug: "zip-extractor", name: "ZIP Extractor" }],
  code: [
    { slug: "json-formatter", name: "JSON Formatter" },
    { slug: "javascript-formatter", name: "JS Formatter" },
  ],
  text: [
    { slug: "word-counter", name: "Word Counter" },
    { slug: "case-converter", name: "Case Converter" },
    { slug: "ai-text-summarizer", name: "AI Summarizer" },
  ],
};

function detect(file: File): { key: string; label: string } | null {
  const name = file.name.toLowerCase();
  const type = file.type;
  if (type === "application/pdf" || name.endsWith(".pdf")) return { key: "pdf", label: "PDF document" };
  if (type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/.test(name)) return { key: "image", label: "image" };
  if (/\.(docx?|odt|rtf)$/.test(name) || type.includes("wordprocessing")) return { key: "word", label: "Word document" };
  if (/\.(xlsx?|csv|ods)$/.test(name) || type.includes("spreadsheet")) return { key: "excel", label: "spreadsheet" };
  if (/\.(pptx?|odp)$/.test(name) || type.includes("presentation")) return { key: "powerpoint", label: "presentation" };
  if (/\.(zip)$/.test(name) || type === "application/zip") return { key: "zip", label: "ZIP archive" };
  if (/\.(json|xml|html?|css|js|ts|sql)$/.test(name)) return { key: "code", label: "code / data file" };
  if (type.startsWith("text/") || /\.(txt|md)$/.test(name)) return { key: "text", label: "text file" };
  return null;
}

export function SmartDropzone() {
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<{ label: string; tools: Suggestion[]; multiple: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const detections = Array.from(files)
      .map(detect)
      .filter((d): d is { key: string; label: string } => d !== null);
    if (detections.length === 0) {
      setResult({ label: "that file type", tools: [], multiple: false });
      return;
    }
    // collect unique tool suggestions across all dropped files
    const seen = new Set<string>();
    const tools: Suggestion[] = [];
    for (const d of detections) {
      for (const t of SUGGESTIONS[d.key] ?? []) {
        if (!seen.has(t.slug)) {
          seen.add(t.slug);
          tools.push(t);
        }
      }
    }
    setResult({
      label: detections[0].label,
      tools: tools.slice(0, 6),
      multiple: files.length > 1,
    });
  }, []);

  const reset = () => setResult(null);

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop a file to find the right tool"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "focus-ring group flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-card/60 px-6 py-7 text-center backdrop-blur transition-all duration-300",
          dragging
            ? "border-primary bg-secondary/60 shadow-mint scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-card",
        )}
      >
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary transition-transform duration-300",
            dragging ? "scale-110" : "group-hover:scale-105",
          )}
        >
          <UploadCloud size={20} aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-foreground">
          Drop a file — we&apos;ll find the right tool
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, images, Office docs, ZIP… nothing is uploaded anywhere
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {result && (
        <div
          className="absolute inset-x-0 top-0 z-10 flex min-h-full flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-6 shadow-card-hover"
          role="status"
          aria-live="polite"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileSearch size={16} className="text-primary" aria-hidden="true" />
            {result.tools.length > 0 ? (
              <>
                Nice — {result.multiple ? "your files look like" : "looks like a"}{" "}
                <span className="text-primary">{result.label}</span>. Try:
              </>
            ) : (
              <>We couldn&apos;t detect {result.label} — but there&apos;s a tool for everything:</>
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {(result.tools.length > 0
              ? result.tools
              : [
                  { slug: "image-converter", name: "Image Converter" },
                  { slug: "file-size-checker", name: "File Size Checker" },
                  { slug: "mime-type-checker", name: "MIME Type Checker" },
                ]
            ).map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="focus-ring group/link inline-flex items-center gap-1.5 rounded-full border bg-secondary px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition-all hover:border-primary/40 hover:shadow-mint"
              >
                <Sparkles size={12} className="text-primary" aria-hidden="true" />
                {tool.name}
                <ArrowRight size={12} className="transition-transform group-hover/link:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="focus-ring text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Drop another file
          </button>
        </div>
      )}
    </div>
  );
}
