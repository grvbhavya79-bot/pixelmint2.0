"use client";

import { useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { secondsToParts, secondsToDecimalHours, parseDurationParts } from "@/lib/calc";

interface DurationRow {
  id: number;
  h: string;
  m: string;
  s: string;
}

let rowId = 3;

export default function TimeCalc() {
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [rows, setRows] = useState<DurationRow[]>([
    { id: 1, h: "2", m: "45", s: "30" },
    { id: 2, h: "1", m: "30", s: "45" },
  ]);

  const total = rows.reduce((sum, row) => sum + parseDurationParts(parseFloat(row.h) || 0, parseFloat(row.m) || 0, parseFloat(row.s) || 0), 0);
  const signed = operation === "subtract"
    ? rows.reduce((sum, row, i) => (i === 0 ? sum : sum - parseDurationParts(parseFloat(row.h) || 0, parseFloat(row.m) || 0, parseFloat(row.s) || 0)), parseDurationParts(parseFloat(rows[0]?.h) || 0, parseFloat(rows[0]?.m) || 0, parseFloat(rows[0]?.s) || 0))
    : total;
  const parts = secondsToParts(signed);

  const updateRow = (id: number, key: keyof DurationRow, value: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2" role="group" aria-label="Operation">
        {(["add", "subtract"] as const).map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => setOperation(op)}
            aria-pressed={operation === op}
            className={`focus-ring rounded-full border px-4 py-2 text-sm font-medium ${operation === op ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            {op === "add" ? "Add durations" : "Subtract durations"}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {rows.map((row, i) => (
          <li key={row.id} className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3">
            <span className="w-full text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:w-auto sm:pt-2">
              {i === 0 ? (operation === "subtract" ? "From" : "Duration 1") : operation === "subtract" ? `Subtract ${i}` : `Duration ${i + 1}`}
            </span>
            {(["h", "m", "s"] as const).map((unit) => (
              <div key={unit} className="w-20 space-y-1">
                <label htmlFor={`tc-${row.id}-${unit}`} className="block text-[11px] text-muted-foreground">
                  {unit === "h" ? "Hours" : unit === "m" ? "Minutes" : "Seconds"}
                </label>
                <Input
                  id={`tc-${row.id}-${unit}`}
                  type="number"
                  value={row[unit]}
                  onChange={(e) => updateRow(row.id, unit, e.target.value)}
                  min={0}
                  className="h-10 text-center font-mono"
                />
              </div>
            ))}
            {rows.length > 2 && (
              <Button variant="ghost" size="sm" onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))} aria-label="Remove this duration row">
                <Trash2 size={14} />
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Button variant="outline" onClick={() => setRows((rs) => [...rs, { id: ++rowId, h: "0", m: "0", s: "0" }])}>
        <Plus size={14} className="mr-1.5" /> Add another duration
      </Button>

      <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {operation === "add" ? "Sum of durations" : "Result after subtracting"}
        </p>
        <p className="mt-2 flex items-center justify-center gap-2 text-3xl font-bold text-foreground" role="status" aria-live="polite">
          <Clock className="text-primary" size={26} />
          {signed < 0 ? "−" : ""}
          {Math.abs(parts.h)}h {Math.abs(parts.m)}m {Math.abs(parts.s)}s
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          = {Math.abs(signed).toLocaleString()} seconds · {secondsToDecimalHours(Math.abs(signed))} decimal hours
          {signed < 0 ? " (negative result — the subtraction goes below zero)" : ""}
        </p>
      </div>
    </div>
  );
}
