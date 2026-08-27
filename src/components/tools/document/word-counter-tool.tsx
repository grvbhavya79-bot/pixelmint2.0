"use client";

import { useMemo, useState } from "react";
import { analyzeText } from "@/lib/text-tools";
import { trackToolUse } from "@/lib/track";
import { pushRecent } from "@/hooks/use-local-tools";

const LIMITS_PRESETS = [
  { label: "X post", value: 280 },
  { label: "SMS", value: 160 },
  { label: "Meta description", value: 160 },
  { label: "Instagram caption", value: 2200 },
];

export default function WordCounterTool({ mode = "words" }: { mode?: string }) {
  const [text, setText] = useState("");
  const [limitPreset, setLimitPreset] = useState<number | null>(280);
  const isWords = mode === "words";

  const stats = useMemo(() => analyzeText(text), [text]);

  const primaryCards = isWords
    ? [
        { label: "Words", value: stats.words.toLocaleString() },
        { label: "Sentences", value: stats.sentences.toLocaleString() },
        { label: "Paragraphs", value: stats.paragraphs.toLocaleString() },
        { label: "Reading time", value: `${stats.readingTimeMinutes} min` },
      ]
    : [
        { label: "Characters", value: stats.characters.toLocaleString() },
        { label: "Without spaces", value: stats.charactersNoSpaces.toLocaleString() },
        { label: "Lines", value: stats.lines.toLocaleString() },
        { label: "Words", value: stats.words.toLocaleString() },
      ];

  const overLimit = limitPreset !== null && stats.characters > limitPreset;
  const percentUsed = limitPreset ? Math.min(100, (stats.characters / limitPreset) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {primaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-4 text-center shadow-card">
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <label htmlFor="wc-input" className="sr-only">
          {isWords ? "Text to analyse" : "Text to count characters"}
        </label>
        <textarea
          id="wc-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => text && trackToolUse(isWords ? "word-counter" : "character-counter")}
          onFocus={() => pushRecent(isWords ? "word-counter" : "character-counter")}
          placeholder={isWords ? "Type or paste text to count words, sentences and paragraphs…" : "Type or paste text to count characters…"}
          className="min-h-56 w-full resize-y rounded-xl bg-transparent p-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground scrollbar-thin"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            Avg word length {stats.averageWordLength} chars · Longest: {stats.longestWord || "—"}
          </span>
          <button
            type="button"
            onClick={() => setText("")}
            className="focus-ring rounded-md font-medium text-primary hover:underline"
          >
            Clear text
          </button>
        </div>
      </div>

      {!isWords && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-[13px] font-medium text-foreground">Character limit presets</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLimitPreset(null)}
              aria-pressed={limitPreset === null}
              className={`focus-ring rounded-full border px-3 py-1.5 text-xs font-medium ${limitPreset === null ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
            >
              No limit
            </button>
            {LIMITS_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setLimitPreset(preset.value)}
                aria-pressed={limitPreset === preset.value}
                className={`focus-ring rounded-full border px-3 py-1.5 text-xs font-medium ${limitPreset === preset.value ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
              >
                {preset.label} ({preset.value})
              </button>
            ))}
          </div>
          {limitPreset !== null && (
            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${overLimit ? "bg-destructive" : "bg-success"}`}
                  style={{ width: `${percentUsed}%` }}
                  role="progressbar"
                  aria-valuenow={stats.characters}
                  aria-valuemin={0}
                  aria-valuemax={limitPreset}
                  aria-label={`${stats.characters} of ${limitPreset} characters used`}
                />
              </div>
              <p className={`mt-1.5 text-xs font-medium ${overLimit ? "text-destructive" : "text-muted-foreground"}`}>
                {stats.characters} / {limitPreset} characters {overLimit ? `— ${stats.characters - limitPreset} over the limit` : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
