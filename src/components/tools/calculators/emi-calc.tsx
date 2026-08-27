"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { calculateEmi } from "@/lib/calc";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function EmiCalc() {
  const [amount, setAmount] = useState(1000000);
  const [rate, setRate] = useState(9);
  const [years, setYears] = useState(10);

  const result = useMemo(() => calculateEmi(amount, rate, years), [amount, rate, years]);
  const interestShare = result.totalPayment > 0 ? (result.totalInterest / result.totalPayment) * 100 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6 rounded-xl border bg-card p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="emi-amount" className="text-[13px] font-medium">Loan amount</Label>
            <span className="text-sm font-semibold text-foreground">{formatCurrency(amount, "INR", 0)}</span>
          </div>
          <Input
            id="emi-amount"
            type="number"
            value={amount}
            min={1000}
            step={10000}
            onChange={(e) => setAmount(Math.max(1000, parseFloat(e.target.value) || 0))}
          />
          <Slider value={[Math.min(amount, 50000000)]} min={10000} max={10000000} step={10000} onValueChange={([v]) => setAmount(v)} aria-label="Loan amount slider" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="emi-rate" className="text-[13px] font-medium">Interest rate (annual)</Label>
            <span className="text-sm font-semibold text-foreground">{rate}%</span>
          </div>
          <Input id="emi-rate" type="number" value={rate} min={0.1} max={60} step={0.1} onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))} />
          <Slider value={[Math.min(rate, 60)]} min={1} max={30} step={0.1} onValueChange={([v]) => setRate(v)} aria-label="Interest rate slider" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="emi-years" className="text-[13px] font-medium">Tenure</Label>
            <span className="text-sm font-semibold text-foreground">{years} years ({result.months} months)</span>
          </div>
          <Input id="emi-years" type="number" value={years} min={1} max={40} onChange={(e) => setYears(Math.max(1, parseInt(e.target.value, 10) || 1))} />
          <Slider value={[Math.min(years, 40)]} min={1} max={30} step={1} onValueChange={([v]) => setYears(v)} aria-label="Tenure slider" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Monthly EMI</p>
          <p className="mt-1 text-4xl font-bold text-primary">{formatCurrency(result.emi, "INR")}</p>
          <p className="mt-1 text-xs text-muted-foreground">for {result.months} months at {rate}% p.a.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Principal</p>
            <p className="mt-1 text-lg font-bold text-foreground">{formatCurrency(amount, "INR", 0)}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${100 - interestShare}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{(100 - interestShare).toFixed(1)}% of total</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total interest</p>
            <p className="mt-1 text-lg font-bold text-foreground">{formatCurrency(result.totalInterest, "INR", 0)}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-chart-3" style={{ width: `${interestShare}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{interestShare.toFixed(1)}% of total</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total repayment</span>
            <span className="font-bold text-foreground">{formatCurrency(result.totalPayment, "INR", 0)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Interest per ₹1 lakh borrowed</span>
            <span className="font-medium text-foreground">{formatCurrency((result.totalInterest / amount) * 100000, "INR", 0)}</span>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            EMI = P × r × (1+r)<sup>n</sup> ÷ ((1+r)<sup>n</sup> − 1), where r is the monthly rate and n the number of months.
            Figure: {formatNumber(result.monthlyRate, 6)} monthly rate.
          </p>
        </div>
      </div>
    </div>
  );
}
