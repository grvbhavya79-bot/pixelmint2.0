"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Loader2, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trackToolUse } from "@/lib/track";

type AiOption = { key: string; label: string; choices: string[] };

type AiToolProps = {
  task: "summarize" | "improve" | "ideas";
  inputLabel: string;
  inputPlaceholder: string;
  inputHint?: string;
  buttonLabel: string;
  minLength?: number;
  options?: AiOption[];
};

/**
 * Shared client for the Pixelmint.fun AI tools.
 * Calls /api/ai — the model itself runs server-side only.
 */
export default function AiTool({
  task,
  inputLabel,
  inputPlaceholder,
  inputHint,
  buttonLabel,
  minLength = 40,
  options = [],
}: AiToolProps) {
  const [input, setInput] = useState("");
  const [opts, setOpts] = useState<Record<string, string>>(
    Object.fromEntries(options.map((o) => [o.key, o.choices[0]])),
  );
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canRun = useMemo(
    () => input.trim().length >= minLength && status !== "loading",
    [input, minLength, status],
  );

  const run = async () => {
    if (!canRun) return;
    setStatus("loading");
    setError(null);
    setOutput(null);
    setCopied(false);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, input: input.trim(), options: opts }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "Something went wrong.");
      setOutput(data.output);
      setStatus("done");
      void trackToolUse(task === "summarize" ? "ai-text-summarizer" : task === "improve" ? "ai-writing-improver" : "ai-idea-generator", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
      setStatus("error");
    }
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const reset = () => {
    setInput("");
    setOutput(null);
    setError(null);
    setStatus("idle");
    setCopied(false);
  };

  return (
    <div className="space-y-4">
      {!output && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor={`ai-input-${task}`}>{inputLabel}</Label>
            <Textarea
              id={`ai-input-${task}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputPlaceholder}
              maxLength={10_000}
              className="min-h-44 font-sans text-sm leading-relaxed"
              aria-describedby={inputHint ? `ai-hint-${task}` : undefined}
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              {inputHint ? (
                <span id={`ai-hint-${task}`}>{inputHint}</span>
              ) : (
                <span />
              )}
              <span aria-live="polite">{input.length.toLocaleString()} / 10,000</span>
            </div>
          </div>

          {options.map((opt) => (
            <div key={opt.key} className="space-y-1.5">
              <Label>{opt.label}</Label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={opt.label}>
                {opt.choices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    role="radio"
                    aria-checked={opts[opt.key] === choice}
                    onClick={() => setOpts((o) => ({ ...o, [opt.key]: choice }))}
                    className={cn(
                      "focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                      opts[opt.key] === choice
                        ? "border-primary bg-secondary text-secondary-foreground"
                        : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <TriangleAlert className="mt-0.5 shrink-0 text-destructive" size={15} aria-hidden="true" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => void run()}
              disabled={!canRun}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              {status === "loading" ? (
                <Loader2 size={15} className="mr-1.5 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles size={15} className="mr-1.5" aria-hidden="true" />
              )}
              {status === "loading" ? "Thinking…" : buttonLabel}
            </Button>
            {input.trim().length > 0 && input.trim().length < minLength && (
              <p className="text-xs text-muted-foreground">
                {minLength - input.trim().length} more characters needed
              </p>
            )}
          </div>
        </>
      )}

      {status === "loading" && (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/50 px-4 py-3.5" role="status">
          <Loader2 className="animate-spin text-primary" size={16} aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            The AI is working on it — this usually takes a few seconds…
          </p>
        </div>
      )}

      {output && status === "done" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/5 px-4 py-3" role="status">
            <span className="pm-check-pop flex h-6 w-6 items-center justify-center rounded-full bg-success text-success-foreground">
              <Check size={14} aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-foreground">Done — your result is ready.</p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Result</Label>
              <span className="text-[11px] text-muted-foreground">{output.length.toLocaleString()} characters</span>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{output}</div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button onClick={() => void copy()} variant="outline" className="gap-1.5">
              {copied ? <Check size={14} className="text-success" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copied ? "Copied!" : "Copy result"}
            </Button>
            <Button onClick={reset} variant="outline" className="gap-1.5">
              <RotateCcw size={14} aria-hidden="true" />
              Start over
            </Button>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            AI results can contain mistakes — double-check important facts. Your input is processed only to generate this result and is not stored.
          </p>
        </div>
      )}
    </div>
  );
}
