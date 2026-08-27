"use client";

import { useState } from "react";
import { ArrowRightLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toCase, type CaseStyle } from "@/lib/text-tools";
import { copyText } from "@/lib/download";
import { trackToolUse } from "@/lib/track";
import { cn } from "@/lib/utils";

const STYLES: { id: CaseStyle; label: string; example: string }[] = [
  { id: "upper", label: "UPPERCASE", example: "HELLO WORLD" },
  { id: "lower", label: "lowercase", example: "hello world" },
  { id: "title", label: "Title Case", example: "Hello World" },
  { id: "sentence", label: "Sentence case", example: "Hello world" },
  { id: "camel", label: "camelCase", example: "helloWorld" },
  { id: "pascal", label: "PascalCase", example: "HelloWorld" },
  { id: "snake", label: "snake_case", example: "hello_world" },
  { id: "kebab", label: "kebab-case", example: "hello-world" },
  { id: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD" },
  { id: "alternating", label: "aLtErNaTiNg", example: "hElLo wOrLd" },
];

export default function CaseConverterTool() {
  const [text, setText] = useState("");
  const [active, setActive] = useState<CaseStyle>("upper");
  const [output, setOutput] = useState("");

  const convert = (style: CaseStyle) => {
    setActive(style);
    setOutput(toCase(text, style));
    trackToolUse("case-converter");
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="case-input" className="mb-1.5 block text-[13px] font-medium text-foreground">
          Your text
        </label>
        <textarea
          id="case-input"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOutput(toCase(e.target.value, active));
          }}
          placeholder="Type or paste text here, then choose a case style below…"
          className="focus-ring min-h-28 w-full resize-y rounded-xl border bg-card p-4 text-sm leading-relaxed placeholder:text-muted-foreground scrollbar-thin"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Case styles">
        {STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => convert(style.id)}
            aria-pressed={active === style.id}
            className={cn(
              "focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              active === style.id
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {style.label}
          </button>
        ))}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="case-output" className="text-[13px] font-medium text-foreground">
            Result ({STYLES.find((s) => s.id === active)?.label})
          </label>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setText(output);
                toast.success("Result moved to input");
              }}
              aria-label="Use result as input"
            >
              <ArrowRightLeft size={13} className="mr-1" /> Swap
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!output}
              onClick={() => void copyText(output).then(() => toast.success("Copied to clipboard"))}
            >
              <Copy size={13} className="mr-1" /> Copy
            </Button>
          </div>
        </div>
        <output
          id="case-output"
          className="block min-h-28 w-full resize-y overflow-auto rounded-xl border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap scrollbar-thin"
          aria-live="polite"
        >
          {output || <span className="text-muted-foreground">The converted text appears here…</span>}
        </output>
      </div>
    </div>
  );
}
