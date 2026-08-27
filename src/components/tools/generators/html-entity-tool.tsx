"use client";

import { useState } from "react";
import { ArrowRightLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/tools/shared/option-controls";
import { copyText } from "@/lib/download";
import { trackToolUse } from "@/lib/track";

type Mode = "encode" | "decode";

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const NAMED_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " ",
  "&copy;": "©",
  "&reg;": "®",
  "&trade;": "™",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
  "&lsquo;": "‘",
  "&rsquo;": "’",
  "&ldquo;": "“",
  "&rdquo;": "”",
  "&euro;": "€",
  "&pound;": "£",
  "&yen;": "¥",
  "&cent;": "¢",
  "&deg;": "°",
  "&middot;": "·",
  "&times;": "×",
  "&divide;": "÷",
};

export default function HtmlEntityTool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [encodeNonAscii, setEncodeNonAscii] = useState(false);
  const [input, setInput] = useState('<script>alert("XSS & danger")</script>');
  const [output, setOutput] = useState("");

  const encode = (text: string): string => {
    let result = text.replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]);
    if (encodeNonAscii) {
      result = result.replace(/[\u00A0-\uFFFF]/g, (c) => `&#${c.codePointAt(0)};`);
    }
    return result;
  };

  const decode = (text: string): string => {
    return text
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec) => {
        const code = parseInt(dec, 10);
        if (code > 0x10ffff) return "";
        try {
          return String.fromCodePoint(code);
        } catch {
          return "";
        }
      })
      .replace(/&[a-zA-Z][a-zA-Z0-9]*;/g, (entity) => NAMED_ENTITIES[entity.toLowerCase()] ?? entity);
  };

  const run = () => {
    setOutput(mode === "encode" ? encode(input) : decode(input));
    trackToolUse("html-entity-encoder-decoder");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-56">
          <SegmentedControl
            ariaLabel="Operation"
            value={mode}
            onValueChange={setMode}
            options={[
              { value: "encode", label: "Encode" },
              { value: "decode", label: "Decode" },
            ]}
          />
        </div>
        {mode === "encode" && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={encodeNonAscii} onChange={(e) => setEncodeNonAscii(e.target.checked)} className="h-4 w-4 accent-[rgb(37_99_235)]" />
            Also encode non-ASCII characters (é → &eacute;-style numeric)
          </label>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="he-in" className="mb-1.5 block text-[13px] font-medium text-foreground">Input</label>
          <textarea
            id="he-in"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={mode === "encode" ? "<div>Text with & special \"characters\"</div>" : "&lt;div&gt;Text &amp; more&lt;/div&gt;"}
            className="focus-ring min-h-36 w-full resize-y rounded-xl border bg-card p-4 font-mono text-[13px] leading-relaxed placeholder:font-sans placeholder:text-muted-foreground scrollbar-thin"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="he-out" className="text-[13px] font-medium text-foreground">Output</label>
            {output && (
              <Button variant="ghost" size="sm" onClick={() => void copyText(output).then(() => toast.success("Copied"))}>
                <Copy size={13} className="mr-1" /> Copy
              </Button>
            )}
          </div>
          <output id="he-out" className="block min-h-36 w-full overflow-auto rounded-xl border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap scrollbar-thin" aria-live="polite">
            {output || <span className="font-sans text-muted-foreground">Result appears here…</span>}
          </output>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Button onClick={run} disabled={!input.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {mode === "encode" ? "Encode Entities" : "Decode Entities"}
        </Button>
        <Button
          variant="outline"
          disabled={!output}
          onClick={() => {
            setInput(output);
            setMode(mode === "encode" ? "decode" : "encode");
            setOutput("");
          }}
        >
          <ArrowRightLeft size={14} className="mr-1.5" /> Use output as input
        </Button>
      </div>
    </div>
  );
}
