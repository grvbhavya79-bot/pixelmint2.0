/**
 * Live currency rates via free, key-less public APIs with server-side caching.
 * Primary: frankfurter.dev (ECB reference rates) — no API key required.
 * Fallback: open.er-api.com — no API key required.
 * Set CURRENCY_API_KEY in production if you switch to a paid provider.
 */

export interface CurrencyRates {
  base: string;
  date: string;
  /** ISO date-time when this snapshot was fetched */
  fetchedAt: string;
  rates: Record<string, number>;
  source: string;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let cache: CurrencyRates | null = null;
let inflight: Promise<CurrencyRates> | null = null;

async function fetchFrankfurter(): Promise<CurrencyRates> {
  const res = await fetch("https://api.frankfurter.dev/v1/latest?base=USD", {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`frankfurter ${res.status}`);
  const data = (await res.json()) as { base: string; date: string; rates: Record<string, number> };
  return {
    base: data.base,
    date: data.date,
    fetchedAt: new Date().toISOString(),
    rates: { USD: 1, ...data.rates },
    source: "frankfurter.dev (ECB)",
  };
}

async function fetchErApi(): Promise<CurrencyRates> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`er-api ${res.status}`);
  const data = (await res.json()) as {
    result?: string;
    base_code?: string;
    time_last_update_utc?: string;
    rates?: Record<string, number>;
  };
  if (data.result !== "success" || !data.rates) throw new Error("er-api bad payload");
  return {
    base: data.base_code ?? "USD",
    date: data.time_last_update_utc ?? new Date().toDateString(),
    fetchedAt: new Date().toISOString(),
    rates: data.rates,
    source: "open.er-api.com",
  };
}

export async function getCurrencyRates(): Promise<CurrencyRates> {
  if (cache && Date.now() - Date.parse(cache.fetchedAt) < CACHE_TTL_MS) {
    return cache;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const providers = [fetchFrankfurter, fetchErApi];
    let lastError: unknown = null;
    for (const provider of providers) {
      try {
        const rates = await provider();
        cache = rates;
        return rates;
      } catch (err) {
        lastError = err;
      }
    }
    // Serve stale cache rather than failing outright
    if (cache) return cache;
    throw lastError instanceof Error ? lastError : new Error("Currency providers unavailable");
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}
