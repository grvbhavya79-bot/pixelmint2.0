"use client";

import { useState } from "react";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptionInput, OptionSwitch } from "@/components/tools/shared/option-controls";
import { randomIntegers } from "@/lib/text-tools";
import { trackToolUse } from "@/lib/track";

export default function RandomNumberTool() {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState("1");
  const [unique, setUnique] = useState(false);
  const [sorted, setSorted] = useState(false);
  const [results, setResults] = useState<number[]>([]);

  const roll = () => {
    const lo = parseInt(min, 10);
    const hi = parseInt(max, 10);
    const n = Math.min(1000, Math.max(1, parseInt(count, 10) || 1));
    if (Number.isNaN(lo) || Number.isNaN(hi) || lo > hi) return;
    let list = randomIntegers(lo, hi, n, unique);
    if (sorted) list = [...list].sort((a, b) => a - b);
    setResults(list);
    trackToolUse("random-number-generator");
  };

  const presets = [
    { label: "Die (1-6)", min: 1, max: 6 },
    { label: "2 Dice (2-12)", min: 2, max: 12 },
    { label: "Coin (0-1)", min: 0, max: 1 },
    { label: "Percent (1-100)", min: 1, max: 100 },
    { label: "Lottery (1-49)", min: 1, max: 49 },
  ];

  return (
    <div className="space-y-4">
      {results.length > 0 && (
        <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
          {results.length === 1 ? (
            <p className="text-6xl font-bold text-primary" role="status" aria-live="polite">{results[0]}</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-2" role="status" aria-live="polite">
              {results.map((n, i) => (
                <span key={i} className="rounded-lg bg-secondary px-3 py-2 font-mono text-lg font-semibold text-secondary-foreground">{n}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3">
        <OptionInput label="Minimum" type="number" value={min} onValueChange={setMin} id="rn-min" />
        <OptionInput label="Maximum" type="number" value={max} onValueChange={setMax} id="rn-max" />
        <OptionInput label="How many" type="number" value={count} onValueChange={setCount} min={1} max={1000} id="rn-count" />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-card p-4">
        <OptionSwitch label="Unique numbers only" checked={unique} onCheckedChange={setUnique} id="rn-unique" />
        <OptionSwitch label="Sort results" checked={sorted} onCheckedChange={setSorted} id="rn-sorted" />
        <Button onClick={roll} className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
          <Dices size={16} className="mr-1.5" /> Generate
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => { setMin(String(preset.min)); setMax(String(preset.max)); }}
            className="focus-ring rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
