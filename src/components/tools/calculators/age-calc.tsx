"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateAge } from "@/lib/calc";
import { formatNumber } from "@/lib/format";

export default function AgeCalc() {
  const [birth, setBirth] = useState("2000-01-01");
  const [at, setAt] = useState(() => new Date().toISOString().slice(0, 10));

  const result = useMemo(() => {
    const b = new Date(birth);
    const a = new Date(at);
    if (Number.isNaN(b.getTime()) || Number.isNaN(a.getTime()) || b > a) return null;
    return calculateAge(b, a);
  }, [birth, at]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="age-birth" className="text-[13px] font-medium">Date of birth</Label>
          <Input id="age-birth" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="age-at" className="text-[13px] font-medium">Age at date</Label>
          <Input id="age-at" type="date" value={at} onChange={(e) => setAt(e.target.value)} />
        </div>
      </div>

      {result ? (
        <>
          <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Exact age</p>
            <p className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
              {result.years} <span className="text-lg font-semibold text-muted-foreground">years</span>, {result.months}{" "}
              <span className="text-lg font-semibold text-muted-foreground">months</span>, {result.days}{" "}
              <span className="text-lg font-semibold text-muted-foreground">days</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Born on a {result.bornOnWeekday}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total days", value: formatNumber(result.totalDays, 0) },
              { label: "Total hours", value: formatNumber(result.totalHours, 0) },
              { label: "Approx. weeks", value: formatNumber(Math.floor(result.totalDays / 7), 0) },
              { label: "Next birthday in", value: result.nextBirthdayIn !== null ? `${result.nextBirthdayIn} days` : "—" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-card p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-lg font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
          Enter a valid birth date that is before the “age at” date.
        </p>
      )}
    </div>
  );
}
