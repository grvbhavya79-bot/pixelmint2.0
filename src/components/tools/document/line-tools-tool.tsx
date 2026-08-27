"use client";

import { useMemo, useState } from "react";
import { ArrowDownAZ, Copy, ListFilter, RemoveFormatting } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeDuplicateLines, sortLines, cleanSpaces, type SortMode } from "@/lib/text-tools";
import { copyText } from "@/lib/download";
import { trackToolUse } from "@/lib/track";
import { cn } from "@/lib/utils";

const SORT_MODES: { id: SortMode; label: string }[] = [
  { id: "az", label: "A → Z" },
  { id: "za", label: "Z → A" },
  { id: "numeric-asc", label: "0 → 9" },
  { id: "numeric-desc", label: "9 → 0" },
  { id: "length-asc", label: "Shortest first" },
  { id: "length-desc", label: "Longest first" },
];

export default function LineToolsTool({ mode = "dedupe" }: { mode?: string }) {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [meta, setMeta] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("az");
  const [caseInsensitive, setCaseInsensitive] = useState(true);
  const [trimLines, setTrimLines] = useState(true);
  const [uniqueWhileSorting, setUniqueWhileSorting] = useState(false);
  const [spaceOpts, setSpaceOpts] = useState({ collapseSpaces: true, trimLines: true, removeEmptyLines: false, removeTabs: false });

  const stats = useMemo(() => {
    const lines = text ? text.split("\n") : [];
    return { total: lines.length, nonEmpty: lines.filter((l) => l.trim()).length };
  }, [text]);

  const run = () => {
    if (mode === "dedupe") {
      const { result, removed } = removeDuplicateLines(text, { ignoreCase: caseInsensitive, trim: trimLines });
      setOutput(result);
      setMeta(`${removed} duplicate line${removed === 1 ? "" : "s"} removed · ${stats.total - removed} lines kept`);
    } else if (mode === "sort") {
      setOutput(sortLines(text, sortMode, { caseInsensitive, unique: uniqueWhileSorting }));
      setMeta(`Sorted ${stats.total} lines (${SORT_MODES.find((m) => m.id === sortMode)?.label})`);
    } else {
      const before = text.length;
      const result = cleanSpaces(text, spaceOpts);
      setOutput(result);
      setMeta(`${before - result.length} characters of extra whitespace removed`);
    }
    trackToolUse(mode === "dedupe" ? "remove-duplicate-lines" : mode === "sort" ? "sort-lines" : "remove-extra-spaces");
  };

  const titles = {
    dedupe: { title: "Remove Duplicate Lines", icon: ListFilter, action: "Remove Duplicates" },
    sort: { title: "Sort Lines", icon: ArrowDownAZ, action: "Sort Lines" },
    spaces: { title: "Remove Extra Spaces", icon: RemoveFormatting, action: "Clean Text" },
  } as const;
  const t = titles[(mode as keyof typeof titles) ?? "dedupe"];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="lt-input" className="text-[13px] font-medium text-foreground">Input ({stats.total} lines)</label>
            {text && (
              <Button variant="ghost" size="sm" onClick={() => { setText(""); setOutput(""); setMeta(""); }}>
                Clear
              </Button>
            )}
          </div>
          <textarea
            id="lt-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your list or text here, one item per line…"
            className="focus-ring min-h-64 w-full resize-y rounded-xl border bg-card p-4 font-mono text-[13px] leading-relaxed placeholder:font-sans placeholder:text-muted-foreground scrollbar-thin"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="lt-output" className="text-[13px] font-medium text-foreground">Result</label>
            <Button
              variant="outline"
              size="sm"
              disabled={!output}
              onClick={() => void copyText(output).then(() => toast.success("Copied to clipboard"))}
            >
              <Copy size={13} className="mr-1" /> Copy
            </Button>
          </div>
          <output
            id="lt-output"
            className="block min-h-64 w-full overflow-auto rounded-xl border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap scrollbar-thin"
            aria-live="polite"
          >
            {output || <span className="font-sans text-muted-foreground">Cleaned text appears here…</span>}
          </output>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border bg-card p-4">
        {mode === "dedupe" && (
          <>
            <Toggle label="Ignore case" checked={caseInsensitive} onChange={setCaseInsensitive} />
            <Toggle label="Trim whitespace before comparing" checked={trimLines} onChange={setTrimLines} />
          </>
        )}
        {mode === "sort" && (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Sort order">
              {SORT_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSortMode(m.id)}
                  aria-pressed={sortMode === m.id}
                  className={cn(
                    "focus-ring rounded-full border px-3 py-1.5 text-xs font-medium",
                    sortMode === m.id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <Toggle label="Case-insensitive" checked={caseInsensitive} onChange={setCaseInsensitive} />
            <Toggle label="Remove duplicates while sorting" checked={uniqueWhileSorting} onChange={setUniqueWhileSorting} />
          </>
        )}
        {mode === "spaces" && (
          <>
            <Toggle label="Collapse double spaces" checked={spaceOpts.collapseSpaces} onChange={(v) => setSpaceOpts((s) => ({ ...s, collapseSpaces: v }))} />
            <Toggle label="Trim line edges" checked={spaceOpts.trimLines} onChange={(v) => setSpaceOpts((s) => ({ ...s, trimLines: v }))} />
            <Toggle label="Remove empty lines" checked={spaceOpts.removeEmptyLines} onChange={(v) => setSpaceOpts((s) => ({ ...s, removeEmptyLines: v }))} />
            <Toggle label="Replace tabs with spaces" checked={spaceOpts.removeTabs} onChange={(v) => setSpaceOpts((s) => ({ ...s, removeTabs: v }))} />
          </>
        )}
        <Button onClick={run} disabled={!text.trim()} className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90">
          <t.icon size={14} className="mr-1.5" />
          {t.action}
        </Button>
      </div>

      {meta && (
        <p role="status" className="text-center text-xs text-muted-foreground">
          {meta}
        </p>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input accent-[rgb(37_99_235)]"
      />
      {label}
    </label>
  );
}
