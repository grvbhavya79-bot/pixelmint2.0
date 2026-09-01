import { createHmac, timingSafeEqual, randomBytes, scryptSync } from "crypto";
import { db } from "@/lib/db";

/**
 * Admin authentication: DB-backed credentials + HMAC-signed session cookie.
 *
 * Security model (fail-closed):
 * - Credentials live in the AdminAccount table as a scrypt hash. The
 *   ADMIN_PASSWORD env var only BOOTSTRAPS the account on first login;
 *   after that the stored hash is authoritative and the password is
 *   managed from the dashboard (Settings tab).
 * - If no account exists AND no ADMIN_PASSWORD is set, login is disabled.
 * - The HMAC signing secret comes from ADMIN_SECRET (or falls back to
 *   ADMIN_PASSWORD). If neither is set, no token can be created/verified.
 * - Session tokens carry a random nonce (unique per login) and the
 *   passwordVersion at issue time, so changing the password instantly
 *   invalidates every previously issued session.
 */

export const ADMIN_COOKIE = "pm_admin";

const ACCOUNT_ID = "primary";
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;

export interface AdminAccount {
  id: string;
  username: string;
  displayName: string;
  panelTitle: string;
  panelTagline: string;
  passwordHash: string;
  passwordVersion: number;
  passwordChangedAt: Date;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function secret(): string | null {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || null;
}

/* ------------------------- Password hashing (scrypt) ---------------------- */

const SCRYPT_KEYLEN = 64;

/** Hash a password with a random salt: "scrypt:<salt-b64>:<hash-b64>". */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt:${salt.toString("base64")}:${hash.toString("base64")}`;
}

/** Constant-time verification of a password against a stored scrypt hash. */
export function verifyPasswordHash(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt" || !parts[1] || !parts[2]) return false;
  try {
    const salt = Buffer.from(parts[1], "base64");
    const expected = Buffer.from(parts[2], "base64");
    const actual = scryptSync(password ?? "", salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/** Strength policy for admin-chosen passwords. */
export function validatePasswordStrength(password: string): { ok: true } | { ok: false; reason: string } {
  if (password.length < 10) return { ok: false, reason: "Password must be at least 10 characters long." };
  if (password.length > 200) return { ok: false, reason: "Password must be at most 200 characters long." };
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, reason: "Password must include at least one letter and one number." };
  }
  const weak = ["admin123", "admin1234", "password1", "password123", "letmein123", "qwerty1234", "1234567890"];
  if (weak.includes(password.toLowerCase())) {
    return { ok: false, reason: "That password is too common — choose something unique." };
  }
  return { ok: true };
}

/* ----------------------------- Account access ----------------------------- */

export async function getAdminAccount(): Promise<AdminAccount | null> {
  return db.adminAccount.findUnique({ where: { id: ACCOUNT_ID } });
}

/**
 * Returns the admin account, bootstrapping it from ADMIN_PASSWORD on first
 * use. Once the row exists the env password no longer grants access (the
 * stored hash wins), giving the dashboard full ownership of the credential.
 */
export async function ensureAdminAccount(): Promise<AdminAccount | null> {
  const existing = await getAdminAccount();
  if (existing) return existing;
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!envPassword) return null; // fail-closed: nothing to bootstrap from
  try {
    return await db.adminAccount.create({
      data: { id: ACCOUNT_ID, passwordHash: hashPassword(envPassword) },
    });
  } catch {
    // Concurrent bootstrap (e.g. parallel logins) — return whichever row won.
    return getAdminAccount();
  }
}

/** True when login is possible: an account exists or can be bootstrapped. */
export async function isAdminConfigured(): Promise<boolean> {
  if (await getAdminAccount()) return true;
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** True when the DB password still matches the env bootstrap value. */
export async function isBootstrapPasswordActive(): Promise<boolean> {
  const account = await getAdminAccount();
  if (!account) return Boolean(process.env.ADMIN_PASSWORD);
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!envPassword) return false;
  return verifyPasswordHash(envPassword, account.passwordHash);
}

/**
 * Verify a login password. Returns the account on success, null on failure
 * (also when nothing is configured).
 */
export async function verifyAdminLogin(password: string): Promise<AdminAccount | null> {
  const account = await ensureAdminAccount();
  if (!account) {
    console.warn("[admin] Login attempt rejected: no admin account is configured.");
    return null;
  }
  return verifyPasswordHash(password ?? "", account.passwordHash) ? account : null;
}

/* ------------------------------ Session tokens ---------------------------- */

export function createSessionToken(passwordVersion: number): string | null {
  const s = secret();
  if (!s) return null;
  // Format: admin.<nonce>.<expiry-ms>.<passwordVersion>
  const payload = `admin.${randomBytes(16).toString("hex")}.${Date.now() + SESSION_TTL_MS}.${passwordVersion}`;
  const sig = createHmac("sha256", s).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const s = secret();
  if (!s || !token) return false;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return false;
  try {
    const payload = Buffer.from(b64, "base64url").toString();
    const parts = payload.split(".");
    if (parts.length !== 4 || parts[0] !== "admin") return false;
    const expected = createHmac("sha256", s).update(payload).digest("hex");
    if (expected.length !== sig.length) return false;
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
    const expires = parseInt(parts[2], 10);
    if (!Number.isFinite(expires) || Date.now() >= expires) return false;
    const pv = parseInt(parts[3], 10);
    if (!Number.isFinite(pv)) return false;
    // Changing the password bumps the version, invalidating old sessions.
    const account = await getAdminAccount();
    return account !== null && account.passwordVersion === pv;
  } catch {
    return false;
  }
}

/** Shared guard for admin API routes — checks the signed session cookie. */
export async function requireAdminAuth(request: Request): Promise<boolean> {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`));
  return verifySessionToken(match?.[1]);
}

/** Serialize account fields that are safe to send to the dashboard. */
export function publicAccount(account: AdminAccount) {
  return {
    username: account.username,
    displayName: account.displayName,
    panelTitle: account.panelTitle,
    panelTagline: account.panelTagline,
    passwordChangedAt: account.passwordChangedAt.toISOString(),
    lastLoginAt: account.lastLoginAt?.toISOString() ?? null,
  };
}

export function generateShortCode(length = 6): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) code += alphabet[bytes[i] % alphabet.length];
  return code;
}
