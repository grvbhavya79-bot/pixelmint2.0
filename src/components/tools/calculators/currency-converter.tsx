"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeftRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pushRecent } from "@/hooks/use-local-tools";

interface RatesPayload {
  base: string;
  date: string;
  fetchedAt: string;
  rates: Record<string, number>;
  source: string;
}

const POPULAR = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "CHF", "CNY", "SGD", "AED", "SAR"];

export default function CurrencyConverter() {
  const [data, setData] = useState<RatesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("INR");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/currency");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Rates unavailable");
      setData(json.rates);
    } catch {
      setError("Live rates couldn't be loaded. Check your connection and retry — rates are never hardcoded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    pushRecent("currency-converter");
  }, [load]);

  const currencies = data ? Object.keys(data.rates).sort() : POPULAR;
  const convert = (): number | null => {
    const v = parseFloat(amount);
    if (!data || Number.isNaN(v)) return null;
    const fromRate = data.rates[from];
    const toRate = data.rates[to];
    if (!fromRate || !toRate) return null;
    return (v / fromRate) * toRate;
  };

  const result = convert();
  const rate = data && data.rates[from] && data.rates[to] ? data.rates[to] / data.rates[from] : null;

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw size={13} className="mr-1" /> Retry
          </Button>
        </div>
      )}

      <div className="grid items-end gap-3 rounded-xl border bg-card p-5 sm:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="cur-amount" className="text-[13px] font-medium text-foreground">Amount</label>
            <Input
              id="cur-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!data}
              className="font-mono text-lg"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cur-from" className="text-[13px] font-medium text-foreground">From</label>
            <select id="cur-from" value={from} onChange={(e) => setFrom(e.target.value)} className="focus-ring h-10 w-full rounded-md border bg-background px-2 text-sm" disabled={!data}>
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="mb-1 h-11 w-11 rounded-full"
          aria-label="Swap currencies"
          onClick={() => { setFrom(to); setTo(from); }}
        >
          <ArrowLeftRight size={16} />
        </Button>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <span className="text-[13px] font-medium text-foreground">Converted</span>
            <div className="flex h-10 items-center overflow-hidden rounded-md border bg-muted/40 px-3 font-mono text-lg font-semibold text-primary" role="status" aria-live="polite">
              {loading ? "…" : result !== null ? result.toLocaleString("en-US", { maximumFractionDigits: 4 }) : "—"}
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cur-to" className="text-[13px] font-medium text-foreground">To</label>
            <select id="cur-to" value={to} onChange={(e) => setTo(e.target.value)} className="focus-ring h-10 w-full rounded-md border bg-background px-2 text-sm" disabled={!data}>
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {data && rate && (
        <>
          <p className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
            1 {from} = <span className="font-mono font-semibold text-foreground">{rate.toFixed(rate < 0.01 ? 6 : 4)} {to}</span>
            {rate > 0 && <> · 1 {to} = <span className="font-mono font-semibold text-foreground">{(1 / rate).toFixed((1 / rate) < 0.01 ? 6 : 4)} {from}</span></>}
          </p>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-foreground">Popular pairs (per 1 {from})</p>
              <p className="text-[11px] text-muted-foreground">
                Last updated: {new Date(data.fetchedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · {data.source}
              </p>
            </div>
            <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {POPULAR.filter((c) => c !== from && data.rates[c]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTo(c)}
                  className={`focus-ring flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs ${to === c ? "bg-secondary" : "bg-muted/50 hover:bg-secondary/60"}`}
                >
                  <span className="font-medium text-muted-foreground">{from} → {c}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {(data.rates[c] / data.rates[from]).toFixed(4)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
