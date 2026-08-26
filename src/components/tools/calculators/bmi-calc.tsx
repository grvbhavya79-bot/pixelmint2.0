"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/tools/shared/option-controls";
import { calculateBmiMetric, calculateBmiImperial } from "@/lib/calc";
import { cn } from "@/lib/utils";

const SCALE = [
  { range: "< 18.5", label: "Underweight", color: "bg-sky-500" },
  { range: "18.5 – 24.9", label: "Normal", color: "bg-success" },
  { range: "25 – 29.9", label: "Overweight", color: "bg-amber-500" },
  { range: "≥ 30", label: "Obese", color: "bg-destructive" },
];

export default function BmiCalc() {
  const [system, setSystem] = useState<"metric" | "imperial">("metric");
  const [heightCm, setHeightCm] = useState("170");
  const [weightKg, setWeightKg] = useState("65");
  const [feet, setFeet] = useState("5");
  const [inches, setInches] = useState("7");
  const [pounds, setPounds] = useState("143");

  const result = useMemo(() => {
    if (system === "metric") {
      const h = parseFloat(heightCm);
      const w = parseFloat(weightKg);
      if (h > 0 && w > 0) return calculateBmiMetric(h, w);
      return null;
    }
    const f = parseInt(feet, 10) || 0;
    const i = parseInt(inches, 10) || 0;
    const p = parseFloat(pounds);
    if (f + i > 0 && p > 0) return calculateBmiImperial(f, i, p);
    return null;
  }, [system, heightCm, weightKg, feet, inches, pounds]);

  const activeIndex = result
    ? result.bmi < 18.5 ? 0 : result.bmi < 25 ? 1 : result.bmi < 30 ? 2 : 3
    : -1;
  const markerPos = result ? Math.min(100, Math.max(0, ((result.bmi - 12) / 28) * 100)) : 0;

  return (
    <div className="space-y-5">
      <div className="max-w-xs">
        <SegmentedControl
          ariaLabel="Measurement system"
          value={system}
          onValueChange={setSystem}
          options={[
            { value: "metric", label: "Metric (cm, kg)" },
            { value: "imperial", label: "Imperial (ft, lb)" },
          ]}
        />
      </div>

      {system === "metric" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bmi-h" className="text-[13px] font-medium">Height (cm)</Label>
            <Input id="bmi-h" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="170" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bmi-w" className="text-[13px] font-medium">Weight (kg)</Label>
            <Input id="bmi-w" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="65" />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="bmi-ft" className="text-[13px] font-medium">Height (feet)</Label>
            <Input id="bmi-ft" type="number" value={feet} onChange={(e) => setFeet(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bmi-in" className="text-[13px] font-medium">Height (inches)</Label>
            <Input id="bmi-in" type="number" value={inches} onChange={(e) => setInches(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bmi-lb" className="text-[13px] font-medium">Weight (lb)</Label>
            <Input id="bmi-lb" type="number" value={pounds} onChange={(e) => setPounds(e.target.value)} />
          </div>
        </div>
      )}

      {result && (
        <>
          <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your BMI</p>
            <p className="mt-1 text-5xl font-bold text-primary">{result.bmi}</p>
            <p className="mt-1.5 inline-block rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
              {result.category}
            </p>
            <div className="relative mt-6">
              <div className="flex h-3 overflow-hidden rounded-full">
                <div className="w-[23%] bg-sky-500" />
                <div className="w-[23%] bg-success" />
                <div className="w-[18%] bg-amber-500" />
                <div className="w-[36%] bg-destructive" />
              </div>
              <div
                className="absolute top-[-6px] h-6 w-1.5 rounded-full border-2 border-white bg-foreground shadow"
                style={{ left: `calc(${markerPos}% - 3px)` }}
                aria-hidden="true"
              />
              <p className="sr-only">BMI scale marker at {result.bmi}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Healthy weight range for your height:{" "}
              <span className="font-semibold text-foreground">
                {system === "metric"
                  ? `${result.healthyMin} – ${result.healthyMax} kg`
                  : `${result.healthyMin} – ${result.healthyMax} lb`}
              </span>
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              BMI is a screening indicator, not a diagnosis — it doesn&apos;t account for muscle mass, age or body composition.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SCALE.map((s, i) => (
              <div key={s.label} className={cn("rounded-lg border p-2.5 text-center", activeIndex === i && "border-primary ring-2 ring-primary/30")}>
                <span className={cn("mx-auto mb-1 block h-2 w-2 rounded-full", s.color)} />
                <p className="text-[11px] font-semibold text-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.range}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
