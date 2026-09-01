import { createHmac, timingSafeEqual, randomBytes } from "crypto";

/**
 * Admin authentication: HMAC-signed session cookie.
 *
 * Security model (fail-closed):
 * - The admin password comes ONLY from the ADMIN_PASSWORD env var.
 *   If it is not set, login is disabled — there is no default password.
 * - The HMAC signing secret comes from ADMIN_SECRET (or falls back to
 *   ADMIN_PASSWORD). If neither is set, no session token can be
 *   created or verified.
 * - Session tokens include a random nonce so every login produces a
 *   unique token (no replayable deterministic tokens).
 */

export const ADMIN_COOKIE = "pm_admin";

function secret(): string | null {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || null;
}

/** True only when a real password is configured via the environment. */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** Shared guard for admin API routes — checks the signed session cookie. */
export function requireAdminAuth(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`));
  return verifySessionToken(match?.[1]);
}

export function checkAdminPassword(password: string): boolean {
  const expectedValue = process.env.ADMIN_PASSWORD;
  if (!expectedValue) {
    console.warn("[admin] Login attempt rejected: ADMIN_PASSWORD is not configured.");
    return false;
  }
  const expected = Buffer.from(expectedValue);
  const given = Buffer.from(password ?? "");
  // Compare lengths first; timingSafeEqual requires equal lengths.
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

export function createSessionToken(): string | null {
  const s = secret();
  if (!s) return null;
  const payload = `admin.${randomBytes(16).toString("hex")}.${Date.now() + 7 * 24 * 3600 * 1000}`;
  const sig = createHmac("sha256", s).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  const s = secret();
  if (!s || !token) return false;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return false;
  try {
    const payload = Buffer.from(b64, "base64url").toString();
    const parts = payload.split(".");
    // Expected format: admin.<nonce>.<expiry>
    if (parts.length !== 3 || parts[0] !== "admin") return false;
    const expected = createHmac("sha256", s).update(payload).digest("hex");
    if (expected.length !== sig.length) return false;
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
    const expires = parseInt(parts[2], 10);
    return Number.isFinite(expires) && Date.now() < expires;
  } catch {
    return false;
  }
}

export function generateShortCode(length = 6): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) code += alphabet[bytes[i] % alphabet.length];
  return code;
}
