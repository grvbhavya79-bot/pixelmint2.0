"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/tools/shared/option-controls";
import { addGst, removeGst } from "@/lib/calc";
import { formatCurrency } from "@/lib/format";

const GST_SLABS = [
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
  { value: "28", label: "28%" },
];

export default function GstCalc() {
  const [mode, setMode] = useState<"exclusive" | "inclusive">("exclusive");
  const [amount, setAmount] = useState("1000");
  const [rate, setRate] = useState("18");
  const [customRate, setCustomRate] = useState("");

  const effectiveRate = customRate.trim() ? customRate : rate;
  const n = parseFloat(effectiveRate) || 0;
  const value = parseFloat(amount) || 0;

  const result = useMemo(() => {
    if (value <= 0) return null;
    return mode === "exclusive" ? addGst(value, n) : removeGst(value, n);
  }, [value, n, mode]);

  return (
    <div className="space-y-5">
      <div className="max-w-sm">
        <SegmentedControl
          ariaLabel="GST mode"
          value={mode}
          onValueChange={setMode}
          options={[
            { value: "exclusive", label: "Add GST (exclusive)" },
            { value: "inclusive", label: "Remove GST (inclusive)" },
          ]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="gst-amount" className="text-[13px] font-medium">
            {mode === "exclusive" ? "Base amount (excl. GST)" : "Total amount (incl. GST)"}
          </Label>
          <Input id="gst-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gst-custom" className="text-[13px] font-medium">Custom rate (overrides slabs)</Label>
          <Input id="gst-custom" type="number" value={customRate} onChange={(e) => setCustomRate(e.target.value)} placeholder="e.g. 3, 0.25" min={0} max={100} step={0.25} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="GST rate slabs">
        {GST_SLABS.map((slab) => (
          <button
            key={slab.value}
            type="button"
            onClick={() => { setRate(slab.value); setCustomRate(""); }}
            aria-pressed={effectiveRate === slab.value}
            className={`focus-ring rounded-full border px-4 py-2 text-sm font-semibold ${effectiveRate === slab.value && !customRate.trim() ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            {slab.label}
          </button>
        ))}
      </div>

      {result && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4 text-center shadow-card">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Base amount</p>
              <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(result.base, "INR")}</p>
            </div>
            <div className="rounded-xl border border-primary/40 bg-secondary/60 p-4 text-center shadow-card">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">GST ({effectiveRate}%)</p>
              <p className="mt-1 text-xl font-bold text-primary">{formatCurrency(result.gst, "INR")}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center shadow-card">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(result.total, "INR")}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {mode === "exclusive"
              ? `GST added on top: ${result.base} + ${result.gst} = ${result.total}`
              : `GST extracted from total: ${result.total} − ${result.gst} = ${result.base} base`}
          </p>
        </>
      )}
    </div>
  );
}
