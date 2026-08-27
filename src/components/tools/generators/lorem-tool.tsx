"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OptionSelect, OptionSwitch } from "@/components/tools/shared/option-controls";
import { generateLorem } from "@/lib/text-tools";
import { copyText } from "@/lib/download";
import { trackToolUse } from "@/lib/track";

export default function LoremTool() {
  const [unit, setUnit] = useState("paragraphs");
  const [count, setCount] = useState("3");
  const [startClassic, setStartClassic] = useState(true);
  const [output, setOutput] = useState("");

  const generate = () => {
    const n = Math.min(100, Math.max(1, parseInt(count, 10) || 1));
    setOutput(generateLorem(unit as "paragraphs" | "sentences" | "words", n, startClassic));
    trackToolUse("lorem-ipsum-generator");
  };

  const wordCount = output ? output.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
        <OptionSelect
          label="Generate"
          value={unit}
          onValueChange={setUnit}
          options={[
            { value: "paragraphs", label: "Paragraphs" },
            { value: "sentences", label: "Sentences" },
            { value: "words", label: "Words" },
          ]}
          id="lorem-unit"
        />
        <OptionSelect
          label="How many"
          value={count}
          onValueChange={setCount}
          options={["1", "3", "5", "10", "25"].map((n) => ({ value: n, label: n }))}
          id="lorem-count"
        />
        <OptionSwitch label="Start with “Lorem ipsum dolor sit amet…”" checked={startClassic} onCheckedChange={setStartClassic} id="lorem-classic" />
      </div>

      <Button onClick={generate} className="bg-primary text-primary-foreground hover:bg-primary/90">
        Generate Lorem Ipsum
      </Button>

      {output && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[13px] font-medium text-foreground">
              Result <span className="font-normal text-muted-foreground">({wordCount.toLocaleString()} words, {output.length.toLocaleString()} chars)</span>
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => void copyText(output).then(() => toast.success("Copied"))}>
                <Copy size={13} className="mr-1" /> Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setOutput("")}>Clear</Button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto rounded-xl border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap scrollbar-thin">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}
