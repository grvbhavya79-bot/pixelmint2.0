/** Formatting helpers shared across the app. */

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

export function savedPercent(original: number, compressed: number): string {
  if (original <= 0) return "0%";
  const pct = Math.max(0, (1 - compressed / original) * 100);
  return `${pct.toFixed(1)}%`;
}

/**
 * Make text safe for pdf-lib standard fonts (WinAnsi).
 * Replaces typographic quotes, dashes and strips other unsupported codepoints.
 */
export function sanitizeWinAnsi(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/\u2022/g, "-")
    .replace(/\u200B/g, "")
     
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A1-\u00FF]/g, "?");
}

export function truncateMiddle(text: string, max = 40): string {
  if (text.length <= max) return text;
  const half = Math.floor((max - 1) / 2);
  return `${text.slice(0, half)}…${text.slice(-half)}`;
}

/** Strip unsafe characters from a user-provided filename. */
export function safeBaseName(name: string): string {
  return (
    name
      .replace(/[/\\?%*:|"<>\x00-\x1F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^\.+/, "") || "file"
  );
}

export function stripExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

export function formatNumber(n: number, maxDecimals = 2): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: maxDecimals,
  }).format(n);
}

export function formatCurrency(n: number, currency = "USD", maxDecimals = 2): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: maxDecimals,
    }).format(n);
  } catch {
    return `${n.toFixed(maxDecimals)} ${currency}`;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
