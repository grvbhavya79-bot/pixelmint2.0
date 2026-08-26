"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dateDifference } from "@/lib/calc";
import { formatNumber } from "@/lib/format";

export default function DateDiffCalc() {
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [includeEnd, setIncludeEnd] = useState(false);

  const result = useMemo(() => {
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
    return dateDifference(s, e, includeEnd);
  }, [start, end, includeEnd]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="dd-start" className="text-[13px] font-medium">Start date</Label>
          <Input id="dd-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-end" className="text-[13px] font-medium">End date</Label>
          <Input id="dd-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={includeEnd} onChange={(e) => setIncludeEnd(e.target.checked)} className="h-4 w-4 accent-[rgb(37_99_235)]" />
        Include the end day in the count
      </label>

      {result && (
        <>
          <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total difference</p>
            <p className="mt-2 text-4xl font-bold text-primary" role="status" aria-live="polite">
              {formatNumber(Math.abs(result.totalDays), 0)} days
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.years > 0 && `${result.years} year${result.years === 1 ? "" : "s"}, `}
              {result.months > 0 && `${result.months} month${result.months === 1 ? "" : "s"}, `}
              {result.days} day{result.days === 1 ? "" : "s"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Weeks", value: formatNumber(Math.abs(result.weeks), 0) },
              { label: "Weekdays (Mon–Fri)", value: formatNumber(Math.abs(result.businessDays), 0) },
              { label: "Weekend days", value: formatNumber(Math.abs(result.totalDays - result.businessDays), 0) },
              { label: "Hours", value: formatNumber(Math.abs(result.totalDays) * 24, 0) },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border bg-card p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-lg font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
