"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/download";
import { toast } from "sonner";

function formatDate(d: Date): string {
  return d.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" });
}

export default function UnixTimestampTool() {
  const [now, setNow] = useState(() => Date.now());
  const [tsInput, setTsInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().slice(0, 16));

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const parsedTs = useMemo(() => {
    const raw = tsInput.trim();
    if (!raw || !/^-?\d+(\.\d+)?$/.test(raw)) return null;
    const num = parseFloat(raw);
    // auto-detect seconds vs milliseconds (and microseconds)
    let ms: number;
    const abs = Math.abs(num);
    if (abs > 1e14) ms = num / 1000; // microseconds
    else if (abs > 1e11) ms = num; // milliseconds
    else ms = num * 1000; // seconds
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : { date, ms };
  }, [tsInput]);

  const parsedDate = useMemo(() => {
    const date = new Date(dateInput);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [dateInput]);

  const relative = parsedTs ? formatRelative(parsedTs.ms - now) : "";

  const copyRow = (label: string, value: string, copyValue?: string) => (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <code className="font-mono text-xs font-semibold text-foreground">{value}</code>
        <button type="button" onClick={() => void copyText(copyValue ?? value).then(() => toast.success("Copied"))} className="focus-ring rounded p-1 text-muted-foreground hover:text-primary" aria-label={`Copy ${label}`}>
          <Copy size={12} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current time</p>
        <p className="mt-1 font-mono text-3xl font-bold text-foreground" role="timer" aria-live="off">
          {Math.floor(now / 1000)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">seconds · {formatDate(new Date(now))}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void copyText(String(Math.floor(Date.now() / 1000))).then(() => toast.success("Timestamp copied"))}>
            Copy seconds
          </Button>
          <Button variant="outline" size="sm" onClick={() => void copyText(String(Date.now())).then(() => toast.success("Timestamp copied"))}>
            Copy milliseconds
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="text-[13px] font-semibold text-foreground">Timestamp → Date</p>
          <input
            type="text"
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
            aria-label="Unix timestamp"
            placeholder="e.g. 1735689600"
            className="focus-ring h-10 w-full rounded-lg border bg-background px-3 font-mono text-sm"
          />
          {parsedTs ? (
            <div className="space-y-1.5">
              {copyRow("Local time", formatDate(parsedTs.date))}
              {copyRow("UTC", parsedTs.date.toUTCString())}
              {copyRow("ISO 8601", parsedTs.date.toISOString())}
              {copyRow("Relative", relative)}
              {copyRow("Milliseconds", String(Math.round(parsedTs.ms)))}
            </div>
          ) : (
            <p className="text-xs text-destructive">Enter a valid Unix timestamp (seconds, ms or µs — auto-detected).</p>
          )}
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="text-[13px] font-semibold text-foreground">Date → Timestamp</p>
          <input
            type="datetime-local"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            aria-label="Date and time"
            className="focus-ring h-10 w-full rounded-lg border bg-background px-3 text-sm"
          />
          {parsedDate && (
            <div className="space-y-1.5">
              {copyRow("Unix (seconds)", String(Math.floor(parsedDate.getTime() / 1000)))}
              {copyRow("Unix (ms)", String(parsedDate.getTime()))}
              {copyRow("ISO 8601", parsedDate.toISOString())}
              {copyRow("UTC", parsedDate.toUTCString())}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelative(deltaMs: number): string {
  const abs = Math.abs(deltaMs);
  const minutes = Math.round(abs / 60000);
  const suffix = deltaMs <= 0 ? "ago" : "from now";
  if (abs < 60000) return deltaMs <= 0 ? "just now" : "in a moment";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ${suffix}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ${suffix}`;
  const days = Math.round(hours / 24);
  if (days < 365) return `${days} day${days === 1 ? "" : "s"} ${suffix}`;
  const years = (days / 365.25).toFixed(1);
  return `${years} years ${suffix}`;
}
