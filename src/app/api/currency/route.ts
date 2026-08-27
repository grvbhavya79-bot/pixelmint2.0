import { NextResponse } from "next/server";
import { getCurrencyRates } from "@/lib/server/currency";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/server/rate-limit";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`currency:${ip}`, RATE_LIMITS.currency.limit, RATE_LIMITS.currency.windowMs);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests — please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }
  try {
    const rates = await getCurrencyRates();
    return NextResponse.json(
      { success: true, rates },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Live exchange rates are temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }
}
