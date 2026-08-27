"use client";

import { useState } from "react";
import { ArrowRightLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/tools/shared/option-controls";
import { copyText } from "@/lib/download";
import { trackToolUse } from "@/lib/track";

type Mode = "encode" | "decode";
type Scope = "component" | "uri" | "file";

export default function UrlCodecTool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [scope, setScope] = useState<Scope>("component");
  const [input, setInput] = useState("https://pixelmint.fun/tools?q=merge pdf&sort=newest");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    try {
      let result: string;
      if (mode === "encode") {
        if (scope === "component") result = encodeURIComponent(input);
        else if (scope === "uri") result = encodeURI(input);
        else result = input.split("/").map((seg) => encodeURIComponent(seg)).join("/");
      } else {
        result = decodeURIComponent(input.replace(/\+/g, " "));
      }
      setOutput(result);
      trackToolUse("url-encoder-decoder");
    } catch {
      setError("This input can't be processed — it may contain a malformed percent-encoding sequence (e.g. a stray %).");
      setOutput("");
    }
  };

  const swap = () => {
    if (!output) return;
    setInput(output);
    setMode(mode === "encode" ? "decode" : "encode");
    setOutput("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-64">
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
          <div className="w-72">
            <SegmentedControl
              ariaLabel="Encoding scope"
              value={scope}
              onValueChange={setScope}
              options={[
                { value: "component", label: "Component" },
                { value: "uri", label: "Full URI" },
                { value: "file", label: "Path" },
              ]}
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="url-in" className="mb-1.5 block text-[13px] font-medium text-foreground">Input</label>
          <textarea
            id="url-in"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="https://pixelmint.fun/path with spaces?q=hello & world"
            className="focus-ring min-h-36 w-full resize-y rounded-xl border bg-card p-4 font-mono text-[13px] leading-relaxed placeholder:font-sans placeholder:text-muted-foreground scrollbar-thin"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="url-out" className="text-[13px] font-medium text-foreground">Output</label>
            {output && (
              <Button variant="ghost" size="sm" onClick={() => void copyText(output).then(() => toast.success("Copied"))}>
                <Copy size={13} className="mr-1" /> Copy
              </Button>
            )}
          </div>
          <output id="url-out" className="block min-h-36 w-full overflow-auto rounded-xl border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap scrollbar-thin" aria-live="polite">
            {output || <span className="font-sans text-muted-foreground">Result appears here…</span>}
          </output>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2.5">
        <Button onClick={run} disabled={!input.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {mode === "encode" ? "Encode URL" : "Decode URL"}
        </Button>
        <Button variant="outline" onClick={swap} disabled={!output}>
          <ArrowRightLeft size={14} className="mr-1.5" /> Use output as input
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Component</span> encodes everything (use for query values) ·{" "}
        <span className="font-medium text-foreground">Full URI</span> keeps ://?&amp;= intact (use for whole links) ·{" "}
        <span className="font-medium text-foreground">Path</span> encodes each path segment separately.
      </p>
    </div>
  );
}
