"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Copy, Minimize2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/download";
import { trackToolUse } from "@/lib/track";

interface JsonError {
  message: string;
  line: number;
  column: number;
}

/** Precise JSON error positions by bracket-matching the parse failure. */
function locateJsonError(text: string): JsonError | null {
  try {
    JSON.parse(text);
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid JSON";
    const posMatch = message.match(/position (\d+)/);
    if (!posMatch) return { message, line: 1, column: 1 };
    const pos = parseInt(posMatch[1], 10);
    const before = text.slice(0, pos);
    const line = before.split("\n").length;
    const column = pos - before.lastIndexOf("\n");
    return { message, line, column };
  }
}

export default function JsonTool({ mode = "format" }: { mode?: string }) {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState("2");
  const [sortKeys, setSortKeys] = useState(false);
  const [result, setResult] = useState("");

  const error = useMemo(() => (input.trim() ? locateJsonError(input) : null), [input]);

  const sortDeep = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sortDeep);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, sortDeep(v)]),
      );
    }
    return value;
  };

  const run = () => {
    if (error || !input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      const value = sortKeys ? sortDeep(parsed) : parsed;
      const space = indent === "tab" ? "\t" : parseInt(indent, 10);
      const output = mode === "minify" ? JSON.stringify(value) : JSON.stringify(value, null, space);
      setResult(output);
      trackToolUse(mode === "format" ? "json-formatter" : mode === "validate" ? "json-validator" : "json-minifier");
    } catch {
      toast.error("Invalid JSON — check the error below the editor.");
    }
  };

  const charSaved = input && result ? Math.max(0, input.length - result.length) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="json-input" className="text-[13px] font-medium text-foreground">JSON input</label>
            {input.trim() && (
              error ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                  <XCircle size={13} /> Invalid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                  <CheckCircle2 size={13} /> Valid JSON
                </span>
              )
            )}
          </div>
          <textarea
            id="json-input"
            value={input}
            onChange={(e) => { setInput(e.target.value); setResult(""); }}
            spellCheck={false}
            placeholder={'{"name": "Pixelmint.fun", "tools": 100, "free": true}'}
            className={`focus-ring min-h-72 w-full resize-y rounded-xl border bg-card p-4 font-mono text-[13px] leading-relaxed placeholder:text-muted-foreground scrollbar-thin ${input.trim() && error ? "border-destructive/60" : ""}`}
          />
          {error && (
            <div role="alert" className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <span className="font-semibold">Line {error.line}, column {error.column}:</span> {error.message}
            </div>
          )}
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="json-output" className="text-[13px] font-medium text-foreground">
              {mode === "minify" ? "Minified output" : mode === "validate" ? "Formatted preview" : "Formatted output"}
            </label>
            {result && (
              <Button variant="ghost" size="sm" onClick={() => void copyText(result).then(() => toast.success("Copied"))}>
                <Copy size={13} className="mr-1" /> Copy
              </Button>
            )}
          </div>
          <output
            id="json-output"
            className="block min-h-72 w-full overflow-auto rounded-xl border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed whitespace-pre scrollbar-thin"
            aria-live="polite"
          >
            {result || <span className="text-muted-foreground">{mode === "validate" ? "Valid JSON shows a formatted preview here…" : "Result appears here…"}</span>}
          </output>
          {mode === "minify" && result && charSaved > 0 && (
            <p className="mt-1.5 text-xs text-success">
              <Minimize2 size={12} className="mr-1 inline" />
              Saved {charSaved.toLocaleString()} characters ({Math.round((charSaved / input.length) * 100)}% smaller)
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {mode === "format" && (
          <div className="flex items-center gap-2" role="group" aria-label="Indentation">
            {["2", "4", "tab"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setIndent(opt)}
                aria-pressed={indent === opt}
                className={`focus-ring rounded-md border px-3 py-1.5 text-xs font-medium ${indent === opt ? "border-primary bg-secondary text-secondary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
              >
                {opt === "tab" ? "Tabs" : `${opt} spaces`}
              </button>
            ))}
            <label className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} className="h-4 w-4 accent-[rgb(37_99_235)]" />
              Sort keys alphabetically
            </label>
          </div>
        )}
        <Button
          onClick={run}
          disabled={!input.trim() || !!error}
          className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {mode === "format" ? "Format JSON" : mode === "validate" ? "Validate & Preview" : "Minify JSON"}
        </Button>
      </div>
    </div>
  );
}
