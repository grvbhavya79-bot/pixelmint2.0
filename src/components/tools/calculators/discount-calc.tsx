"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateDiscount } from "@/lib/calc";
import { formatCurrency } from "@/lib/format";

export default function DiscountCalc() {
  const [price, setPrice] = useState("2499");
  const [d1, setD1] = useState("20");
  const [d2, setD2] = useState("");

  const result = useMemo(() => {
    const p = parseFloat(price);
    if (!(p > 0)) return null;
    return calculateDiscount(p, parseFloat(d1) || 0, parseFloat(d2) || 0);
  }, [price, d1, d2]);

  const hasSecond = (parseFloat(d2) || 0) > 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="dc-price" className="text-[13px] font-medium">Original price</Label>
          <Input id="dc-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2499" min={0} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dc-1" className="text-[13px] font-medium">Discount</Label>
          <Input id="dc-1" type="number" value={d1} onChange={(e) => setD1(e.target.value)} placeholder="20" min={0} max={100} step={0.5} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dc-2" className="text-[13px] font-medium">Extra discount (optional)</Label>
          <Input id="dc-2" type="number" value={d2} onChange={(e) => setD2(e.target.value)} placeholder="10" min={0} max={100} step={0.5} />
        </div>
      </div>

      {result && (
        <>
          <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Final price</p>
            <p className="mt-1 text-4xl font-bold text-primary">{formatCurrency(result.final, "INR")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You save <span className="font-semibold text-success">{formatCurrency(result.totalOff, "INR")}</span>
              {result.original > 0 ? ` (${((result.totalOff / result.original) * 100).toFixed(1)}%)` : ""}
            </p>
          </div>

          {hasSecond && (
            <div className="rounded-xl border bg-card p-4">
              <p className="text-[13px] font-semibold text-foreground">How the stacked discount works</p>
              <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <li>1. Start: <span className="font-medium text-foreground">{formatCurrency(result.original, "INR", 0)}</span></li>
                <li>2. After first {d1}%: −{formatCurrency(result.discount1, "INR", 0)} → <span className="font-medium text-foreground">{formatCurrency(result.original - result.discount1, "INR", 0)}</span></li>
                <li>3. After extra {d2}%: −{formatCurrency(result.discount2, "INR", 0)} → <span className="font-medium text-foreground">{formatCurrency(result.final, "INR", 0)}</span></li>
                <li className="pt-1 text-[11px]">Note: {d1}% + {d2}% stacked is not the same as a single {(parseFloat(d1) + parseFloat(d2)).toFixed(0)}% discount — the second discount applies to the already-reduced price.</li>
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}
