import { createHmac, timingSafeEqual, randomBytes } from "crypto";

/**
 * Admin authentication: HMAC-signed session cookie.
 * Password comes from ADMIN_PASSWORD env (see .env.example).
 */

export const ADMIN_COOKIE = "tb100_admin";

function secret(): string {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "toolbox100-dev-secret";
}

function expectedPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

export function checkAdminPassword(password: string): boolean {
  const expected = Buffer.from(expectedPassword());
  const given = Buffer.from(password ?? "");
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

export function createSessionToken(): string {
  const payload = `admin.${Date.now() + 7 * 24 * 3600 * 1000}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return false;
  try {
    const payload = Buffer.from(b64, "base64url").toString();
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    if (expected.length !== sig.length) return false;
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
    const expires = parseInt(payload.split(".")[1] ?? "0", 10);
    return Date.now() < expires;
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
