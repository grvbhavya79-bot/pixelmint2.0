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
 * - The HMAC signing secret comes from ADMIN_SECRET. If it is not set,
 *   no token can be created or verified.
 * - Session tokens carry a random nonce (unique per login) and the
 *   passwordVersion at issue time, so changing the password instantly
 *   invalidates every previously issued session.
 *
 * Session lifetime ("ends when you leave the site"):
 * - The cookie is a browser-session cookie (no maxAge): it is deleted
 *   when the browser closes.
 * - Tokens expire after SESSION_TTL_MS (30 min) and are renewed by a
 *   heartbeat from the dashboard while it is open, so an abandoned tab
 *   dies within 30 minutes.
 * - When the dashboard is closed/navigated away from, it sends a beacon
 *   to /api/admin/session/end which revokes the session nonce
 *   immediately. A short grace window (SESSION_GRACE_MS) lets a page
 *   reload in the same browser resurrect the session; after that the
 *   revocation is permanent. Explicit sign-out revokes permanently.
 */

export const ADMIN_COOKIE = "pm_admin";

const ACCOUNT_ID = "primary";
/** Idle timeout: tokens expire this long after the last renewal. */
export const SESSION_TTL_MS = 30 * 60 * 1000;
const SESSION_GRACE_MS = 90 * 1000;

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
  const configured = process.env.ADMIN_SECRET;
  return configured && configured.length >= 32 ? configured : null;
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

export interface SessionInfo {
  nonce: string;
  expires: number;
  passwordVersion: number;
}

/**
 * Revocation registry: nonce -> revokedAt (ms). A revocation takes effect
 * immediately; a request arriving within SESSION_GRACE_MS of revokedAt
 * cancels it (covers page reloads and other still-open tabs). Revocations
 * older than the grace window are permanent. Kept in memory — a server
 * restart clears it, which is fail-safe because tokens still expire by TTL.
 */
const revokedNonces = new Map<string, number>();

/**
 * A revocation entry must outlive the token it kills: tokens expire at most
 * SESSION_TTL_MS after they were minted, so an entry is safe to drop only
 * after the grace window PLUS the TTL has elapsed.
 */
const REVOKE_RETENTION_MS = SESSION_TTL_MS + SESSION_GRACE_MS + 60_000;

function sweepRevocations(now: number) {
  for (const [n, t] of revokedNonces) {
    if (now - t > REVOKE_RETENTION_MS) revokedNonces.delete(n);
  }
}

/** Revoke a session nonce. Pass a custom `at` to simulate/backdate (tests). */
export function revokeSession(nonce: string, at: number = Date.now()): void {
  if (!nonce) return;
  // Revocation is instant; the grace window is enforced at verify time.
  revokedNonces.set(nonce, at);
  if (revokedNonces.size > 1000) sweepRevocations(Date.now());
}

/** Hard revocation: no grace window, cannot be resurrected. */
export function revokeSessionPermanently(nonce: string): void {
  revokeSession(nonce, Date.now() - SESSION_GRACE_MS - 1000);
}

/**
 * Returns true when the nonce was revoked so long ago that nothing can
 * resurrect it; a recent revocation is returned as "not yet" because the
 * verify path cancels it instead (see verifySessionToken).
 */
function isPermanentlyRevoked(nonce: string, now: number): boolean {
  const revokedAt = revokedNonces.get(nonce);
  if (revokedAt === undefined) return false;
  return now - revokedAt > SESSION_GRACE_MS;
}

/** Cookie attributes for the admin session: browser-session scoped. */
export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    // Deliberately NO maxAge/expires: the cookie lives for the browser
    // session only and disappears when the browser is closed.
  };
}

export function createSessionToken(passwordVersion: number, nonce?: string): string | null {
  const s = secret();
  if (!s) return null;
  // Format: admin.<nonce>.<expiry-ms>.<passwordVersion>
  const payload = `admin.${nonce ?? randomBytes(16).toString("hex")}.${Date.now() + SESSION_TTL_MS}.${passwordVersion}`;
  const sig = createHmac("sha256", s).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionInfo | null> {
  const s = secret();
  if (!s || !token) return null;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  try {
    const payload = Buffer.from(b64, "base64url").toString();
    const parts = payload.split(".");
    if (parts.length !== 4 || parts[0] !== "admin") return null;
    const expected = createHmac("sha256", s).update(payload).digest("hex");
    if (expected.length !== sig.length) return null;
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
    const expires = parseInt(parts[2], 10);
    if (!Number.isFinite(expires) || Date.now() >= expires) return null;
    const pv = parseInt(parts[3], 10);
    if (!Number.isFinite(pv)) return null;
    // Changing the password bumps the version, invalidating old sessions.
    const account = await getAdminAccount();
    if (!account || account.passwordVersion !== pv) return null;

    // Beacon revocation: permanent after the grace window (entry is kept so
    // the token stays dead); a request that arrives within the window means
    // the session is still in active use (page reload / another open tab),
    // so the revocation is cancelled instead.
    const nonce = parts[1];
    const now = Date.now();
    if (isPermanentlyRevoked(nonce, now)) return null;
    if (revokedNonces.has(nonce)) revokedNonces.delete(nonce); // still in grace: cancel revoke

    return { nonce, expires, passwordVersion: pv };
  } catch {
    return null;
  }
}

/**
 * Shared guard for admin API routes — checks the signed session cookie and
 * returns the session info (nonce/expiry/version) or null. Truthiness of the
 * returned object is enough for simple `if (!(await requireAdminAuth(...)))`
 * checks.
 */
export async function requireAdminAuth(request: Request): Promise<SessionInfo | null> {
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
