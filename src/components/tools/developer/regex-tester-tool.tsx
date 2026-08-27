"use client";

import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

const FLAGS = [
  { id: "g", label: "global", desc: "find all matches" },
  { id: "i", label: "ignore case", desc: "case-insensitive" },
  { id: "m", label: "multiline", desc: "^ and $ match line edges" },
  { id: "s", label: "dotAll", desc: ". also matches newlines" },
  { id: "u", label: "unicode", desc: "full unicode matching" },
] as const;

interface MatchRow {
  index: number;
  text: string;
  groups: { name?: string; value: string }[];
}

export default function RegexTesterTool() {
  const [pattern, setPattern] = useState("(\\w+)@(\\w+\\.\\w+)");
  const [flags, setFlags] = useState<Set<string>>(new Set(["g"]));
  const [testText, setTestText] = useState("Contact us at hello@toolbox100.com or support@example.io — we reply within a day.");

  const { regex, error } = useMemo(() => {
    if (!pattern) return { regex: null, error: null as string | null };
    try {
      return { regex: new RegExp(pattern, [...flags].join("")), error: null };
    } catch (err) {
      return { regex: null, error: err instanceof Error ? err.message : "Invalid regular expression" };
    }
  }, [pattern, flags]);

  const { matches, highlighted } = useMemo(() => {
    if (!regex || !testText) return { matches: [] as MatchRow[], highlighted: testText };
    const rows: MatchRow[] = [];
    const globalRegex = regex.flags.includes("g") ? regex : new RegExp(regex.source, regex.flags + "g");
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = globalRegex.exec(testText)) !== null && guard < 500) {
      const groups: { name?: string; value: string }[] = [];
      if (m.groups) {
        for (const [name, value] of Object.entries(m.groups)) {
          groups.push({ name, value: value ?? "—" });
        }
      }
      for (let i = 1; i < m.length; i++) {
        groups.push({ name: `$${i}`, value: m[i] ?? "—" });
      }
      rows.push({ index: m.index, text: m[0], groups });
      // eslint-disable-next-line react-hooks/immutability -- lastIndex mutation is intentional for the global exec loop
      if (m.index === globalRegex.lastIndex) globalRegex.lastIndex++;
      guard++;
    }
    // build highlighted view
    const parts: string[] = [];
    let cursor = 0;
    for (const row of rows) {
      const start = row.index;
      const end = row.index + row.text.length;
      parts.push(escapeHtml(testText.slice(cursor, start)));
      parts.push(`<mark class="rounded bg-amber-200 px-0.5 text-slate-900 dark:bg-amber-500/70 dark:text-slate-900">${escapeHtml(testText.slice(start, end))}</mark>`);
      cursor = end;
    }
    parts.push(escapeHtml(testText.slice(cursor)));
    return { matches: rows, highlighted: parts.join("") };
  }, [regex, testText]);

  const toggleFlag = (id: string) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <label htmlFor="re-pattern" className="text-[13px] font-medium text-foreground">Regular expression</label>
          <div className="flex items-center rounded-lg border bg-background px-3 font-mono text-sm">
            <span className="text-muted-foreground" aria-hidden="true">/</span>
            <input
              id="re-pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              spellCheck={false}
              className="h-10 flex-1 bg-transparent px-1 font-mono outline-none"
              placeholder="\\w+"
            />
            <span className="text-muted-foreground" aria-hidden="true">/{[...flags].join("")}</span>
          </div>
        </div>
      </div>

      <fieldset className="rounded-xl border bg-card p-4">
        <legend className="px-1 text-[13px] font-medium text-foreground">Flags</legend>
        <div className="flex flex-wrap gap-2">
          {FLAGS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => toggleFlag(f.id)}
              aria-pressed={flags.has(f.id)}
              title={f.desc}
              className={`focus-ring rounded-full border px-3 py-1.5 text-xs font-medium ${flags.has(f.id) ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
            >
              {f.label} ({f.id})
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="re-text" className="mb-1.5 block text-[13px] font-medium text-foreground">Test text</label>
          <textarea
            id="re-text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            spellCheck={false}
            className="focus-ring min-h-40 w-full resize-y rounded-xl border bg-card p-4 font-mono text-[13px] leading-relaxed scrollbar-thin"
          />
        </div>
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-foreground">
            Highlighted matches{" "}
            <span className="font-normal text-muted-foreground">
              ({matches.length} match{matches.length === 1 ? "" : "es"})
            </span>
          </p>
          <div
            className="min-h-40 w-full overflow-auto whitespace-pre-wrap rounded-xl border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed scrollbar-thin"
            aria-live="polite"
            dangerouslySetInnerHTML={{ __html: highlighted || "<span class='text-muted-foreground'>Matches highlight here…</span>" }}
          />
        </div>
      </div>

      {matches.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b bg-muted/50 px-4 py-2 text-xs font-semibold text-foreground">
            Capture groups
          </div>
          <ul className="max-h-64 divide-y overflow-y-auto scrollbar-thin">
            {matches.map((match, i) => (
              <li key={i} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-secondary-foreground">#{i + 1} @ {match.index}</span>
                  <span className="font-mono text-sm font-medium text-foreground">{match.text || "(empty)"}</span>
                </div>
                {match.groups.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {match.groups.map((g, gi) => (
                      <span key={gi} className="rounded-md border bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                        <span className="text-primary">{g.name ?? `$${gi + 1}`}</span> = {g.value}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
