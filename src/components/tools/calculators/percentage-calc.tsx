"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { percentOf, whatPercent, percentChange, applyPercent, percentDifference } from "@/lib/calc";
import { formatNumber } from "@/lib/format";

function NumInput({ id, value, onChange, label, suffix }: { id: string; value: string; onChange: (v: string) => void; label: string; suffix?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium">{label}</Label>
      <div className="relative">
        <Input id={id} type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" className={suffix ? "pr-10" : ""} />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function ResultCard({ label, value, formula }: { label: string; value: string; formula?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-center shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-primary">{value}</p>
      {formula && <p className="mt-1 text-[11px] text-muted-foreground">{formula}</p>}
    </div>
  );
}

export default function PercentageCalc() {
  const [x, setX] = useState("25");
  const [y, setY] = useState("200");
  const [part, setPart] = useState("50");
  const [whole, setWhole] = useState("200");
  const [from, setFrom] = useState("80");
  const [to, setTo] = useState("100");
  const [base, setBase] = useState("1500");
  const [pct, setPct] = useState("12");
  const [diffA, setDiffA] = useState("40");
  const [diffB, setDiffB] = useState("60");

  const n = (v: string) => parseFloat(v) || 0;

  const change = useMemo(() => percentChange(n(from), n(to)), [from, to]);

  return (
    <Tabs defaultValue="of" className="space-y-5">
      <TabsList className="flex h-auto flex-wrap gap-1">
        <TabsTrigger value="of">X% of Y</TabsTrigger>
        <TabsTrigger value="is">X is what % of Y</TabsTrigger>
        <TabsTrigger value="change">% change</TabsTrigger>
        <TabsTrigger value="incdec">Increase / decrease</TabsTrigger>
        <TabsTrigger value="diff">% difference</TabsTrigger>
      </TabsList>

      <TabsContent value="of" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <NumInput id="pct-x" label="Percentage (X)" value={x} onChange={setX} suffix="%" />
          <NumInput id="pct-y" label="Of value (Y)" value={y} onChange={setY} />
        </div>
        <ResultCard label={`${x || 0}% of ${y || 0}`} value={formatNumber(percentOf(n(x), n(y)))} formula={`${x || 0} ÷ 100 × ${y || 0}`} />
      </TabsContent>

      <TabsContent value="is" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <NumInput id="pct-part" label="Part value (X)" value={part} onChange={setPart} />
          <NumInput id="pct-whole" label="Whole value (Y)" value={whole} onChange={setWhole} />
        </div>
        <ResultCard label={`${part || 0} is this % of ${whole || 0}`} value={`${formatNumber(whatPercent(n(part), n(whole)), 4)}%`} formula={`${part || 0} ÷ ${whole || 0} × 100`} />
      </TabsContent>

      <TabsContent value="change" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <NumInput id="pct-from" label="From (old value)" value={from} onChange={setFrom} />
          <NumInput id="pct-to" label="To (new value)" value={to} onChange={setTo} />
        </div>
        <ResultCard
          label={change >= 0 ? "Percentage increase" : "Percentage decrease"}
          value={`${formatNumber(Math.abs(change), 2)}%`}
          formula={`(${to || 0} − ${from || 0}) ÷ |${from || 0}| × 100`}
        />
      </TabsContent>

      <TabsContent value="incdec" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <NumInput id="pct-base" label="Base value" value={base} onChange={setBase} />
          <NumInput id="pct-pct" label="Percentage" value={pct} onChange={setPct} suffix="%" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ResultCard label={`Increased by ${pct || 0}%`} value={formatNumber(applyPercent(n(base), n(pct), "increase"))} />
          <ResultCard label={`Decreased by ${pct || 0}%`} value={formatNumber(applyPercent(n(base), n(pct), "decrease"))} />
        </div>
      </TabsContent>

      <TabsContent value="diff" className="space-y-4">
        <p className="text-xs text-muted-foreground">Percentage difference compares two values relative to their average — used when neither is clearly the “original”.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumInput id="pct-da" label="Value A" value={diffA} onChange={setDiffA} />
          <NumInput id="pct-db" label="Value B" value={diffB} onChange={setDiffB} />
        </div>
        <ResultCard label="Percentage difference" value={`${formatNumber(percentDifference(n(diffA), n(diffB)), 2)}%`} formula={`|${diffA || 0} − ${diffB || 0}| ÷ ((${diffA || 0} + ${diffB || 0}) ÷ 2) × 100`} />
      </TabsContent>
    </Tabs>
  );
}
