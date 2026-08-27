/** URL safety checks for the shortener. */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
]);

export interface UrlCheckResult {
  ok: boolean;
  reason?: string;
  url?: string;
}

export function checkDestinationUrl(raw: string): UrlCheckResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "Please enter a destination URL." };
  if (trimmed.length > 2048) return { ok: false, reason: "URL is too long (max 2048 characters)." };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: "That does not look like a valid URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "Only http:// and https:// links are allowed." };
  }

  const host = parsed.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
  ) {
    return { ok: false, reason: "Private and local addresses are not allowed." };
  }

  // Punycode / suspicious hosts
  if (host.includes("xn--")) {
    return { ok: false, reason: "Punycode domains are not accepted to prevent phishing." };
  }

  return { ok: true, url: parsed.toString() };
}

export function isSafeShortCode(code: string): boolean {
  return /^[a-zA-Z0-9_-]{4,32}$/.test(code);
}
