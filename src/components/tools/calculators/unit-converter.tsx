"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UNIT_FAMILIES, TEMPERATURE_UNITS, convertUnit, formatConversion, type UnitFamily,
} from "@/lib/units";

const FAMILY_LABELS: Record<UnitFamily, string> = {
  length: "Length",
  weight: "Weight",
  temperature: "Temperature",
  area: "Area",
  volume: "Volume",
  speed: "Speed",
  data: "Data",
  time: "Time",
};

export default function UnitConverter() {
  const [family, setFamily] = useState<UnitFamily>("length");
  const [from, setFrom] = useState("cm");
  const [to, setTo] = useState("in");
  const [value, setValue] = useState("100");

  const units = family === "temperature"
    ? TEMPERATURE_UNITS.map((u) => ({ id: u.id, name: u.name, symbol: u.symbol }))
    : UNIT_FAMILIES[family];

  const changeFamily = (next: UnitFamily) => {
    setFamily(next);
    if (next === "temperature") {
      setFrom("C");
      setTo("F");
    } else {
      const list = UNIT_FAMILIES[next];
      setFrom(list[1]?.id ?? list[0].id);
      setTo(list[Math.min(4, list.length - 1)].id);
    }
  };

  const result = useMemo(() => {
    const v = parseFloat(value);
    if (Number.isNaN(v)) return null;
    return convertUnit(v, from, to, family);
  }, [value, from, to, family]);

  const fromUnit = units.find((u) => u.id === from);
  const toUnit = units.find((u) => u.id === to);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Measurement category">
        {(Object.keys(FAMILY_LABELS) as UnitFamily[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => changeFamily(f)}
            aria-pressed={family === f}
            className={`focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium ${family === f ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
          >
            {FAMILY_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="grid items-end gap-3 rounded-xl border bg-card p-5 sm:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="uc-value" className="text-[13px] font-medium">Value</Label>
            <Input id="uc-value" type="number" value={value} onChange={(e) => setValue(e.target.value)} className="font-mono text-lg" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uc-from" className="text-[13px] font-medium">From</Label>
            <select
              id="uc-from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="focus-ring h-10 w-full rounded-md border bg-background px-2 text-sm"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
              ))}
            </select>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="mb-1 h-11 w-11 rounded-full"
          aria-label="Swap units"
          onClick={() => { setFrom(to); setTo(from); }}
        >
          <ArrowLeftRight size={16} />
        </Button>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium">Result</Label>
            <div className="flex h-10 items-center overflow-hidden rounded-md border bg-muted/40 px-3 font-mono text-lg font-semibold text-primary">
              {result !== null ? formatConversion(result) : "—"}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uc-to" className="text-[13px] font-medium">To</Label>
            <select
              id="uc-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="focus-ring h-10 w-full rounded-md border bg-background px-2 text-sm"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {result !== null && value && !Number.isNaN(parseFloat(value)) && (
        <p className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground" role="status">
          <span className="font-mono font-semibold text-foreground">{value}</span> {fromUnit?.name.toLowerCase()} ={" "}
          <span className="font-mono font-semibold text-primary">{formatConversion(result)}</span> {toUnit?.name.toLowerCase()}
        </p>
      )}

      {family !== "temperature" && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-[13px] font-semibold text-foreground">Common conversions from {fromUnit?.name}</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {units.filter((u) => u.id !== from).map((u) => {
              const converted = convertUnit(parseFloat(value) || 1, from, u.id, family);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setTo(u.id)}
                  className="focus-ring flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-left text-xs hover:bg-secondary"
                >
                  <span className="text-muted-foreground">1 {fromUnit?.symbol} →</span>
                  <span className="font-mono font-semibold text-foreground">
                    {converted !== null ? formatConversion(converted) : "—"} {u.symbol}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
