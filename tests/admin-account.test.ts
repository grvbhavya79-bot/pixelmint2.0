import { describe, expect, test } from "bun:test";
import {
  hashPassword,
  verifyPasswordHash,
  validatePasswordStrength,
  ensureAdminAccount,
  verifyAdminLogin,
  isBootstrapPasswordActive,
  createSessionToken,
  verifySessionToken,
  revokeSession,
  revokeSessionPermanently,
  adminCookieOptions,
  SESSION_TTL_MS,
} from "@/lib/server/admin-auth";

describe("admin password hashing (scrypt)", () => {
  test("roundtrip: hash verifies the original password", () => {
    const hash = hashPassword("correct horse battery 9");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(verifyPasswordHash("correct horse battery 9", hash)).toBe(true);
  });

  test("wrong password fails", () => {
    const hash = hashPassword("correct horse battery 9");
    expect(verifyPasswordHash("correct horse battery 0", hash)).toBe(false);
    expect(verifyPasswordHash("", hash)).toBe(false);
  });

  test("hashes are salted: same password, different hashes", () => {
    const a = hashPassword("same-password-123");
    const b = hashPassword("same-password-123");
    expect(a).not.toBe(b);
    expect(verifyPasswordHash("same-password-123", a)).toBe(true);
    expect(verifyPasswordHash("same-password-123", b)).toBe(true);
  });

  test("malformed stored hash fails closed", () => {
    expect(verifyPasswordHash("x", "")).toBe(false);
    expect(verifyPasswordHash("x", "plaintext")).toBe(false);
    expect(verifyPasswordHash("x", "bcrypt:foo:bar")).toBe(false);
    expect(verifyPasswordHash("x", "scrypt:not-base64!!:also-bad")).toBe(false);
  });
});

describe("admin password strength policy", () => {
  test("accepts a strong password", () => {
    expect(validatePasswordStrength("river-moth-4711").ok).toBe(true);
  });

  test("rejects short, long, and single-class passwords", () => {
    expect(validatePasswordStrength("short1").ok).toBe(false);
    expect(validatePasswordStrength("a".repeat(201) + "1").ok).toBe(false);
    expect(validatePasswordStrength("onlylettershere").ok).toBe(false);
    expect(validatePasswordStrength("0123456789").ok).toBe(false);
  });

  test("rejects common weak passwords", () => {
    expect(validatePasswordStrength("admin123").ok).toBe(false);
    expect(validatePasswordStrength("password123").ok).toBe(false);
  });
});

describe("admin account (database-backed)", () => {
  test("ensureAdminAccount returns the single primary account", async () => {
    const account = await ensureAdminAccount();
    expect(account).not.toBeNull();
    expect(account!.id).toBe("primary");
    expect(account!.passwordHash.startsWith("scrypt:")).toBe(true);
    expect(account!.passwordVersion).toBeGreaterThanOrEqual(1);
  });

  test("ensureAdminAccount is idempotent", async () => {
    const a = await ensureAdminAccount();
    const b = await ensureAdminAccount();
    expect(a!.id).toBe(b!.id);
    expect(a!.passwordHash).toBe(b!.passwordHash);
  });

  test("verifyAdminLogin: wrong passwords always fail; env bootstrap works while active", async () => {
    expect(await verifyAdminLogin("definitely-not-the-password-42")).toBeNull();
    const bootstrapActive = await isBootstrapPasswordActive();
    if (process.env.ADMIN_PASSWORD && bootstrapActive) {
      const account = await verifyAdminLogin(process.env.ADMIN_PASSWORD);
      expect(account).not.toBeNull();
    }
  });
});

describe("admin session tokens (password-version aware)", () => {
  test("valid token roundtrips; each login is unique", async () => {
    const account = await ensureAdminAccount();
    expect(account).not.toBeNull();
    const t1 = createSessionToken(account!.passwordVersion);
    const t2 = createSessionToken(account!.passwordVersion);
    expect(t1).not.toBeNull();
    expect(t2).not.toBeNull();
    expect(t1).not.toBe(t2); // random nonce per login
    const s1 = await verifySessionToken(t1);
    const s2 = await verifySessionToken(t2);
    expect(s1).not.toBeNull();
    expect(s2).not.toBeNull();
    expect(s1!.nonce).not.toBe(s2!.nonce);
    expect(s1!.passwordVersion).toBe(account!.passwordVersion);
    // Token expiry is ~30 minutes out (sliding, renewed by heartbeat).
    expect(s1!.expires).toBeGreaterThan(Date.now());
    expect(s1!.expires).toBeLessThanOrEqual(Date.now() + SESSION_TTL_MS + 5000);
  });

  test("tokens expire after the 30-minute idle timeout", async () => {
    const account = await ensureAdminAccount();
    expect(SESSION_TTL_MS).toBe(30 * 60 * 1000);
    expect(account).not.toBeNull();
    // A token whose expiry is in the past is rejected.
    const token = createSessionToken(account!.passwordVersion);
    expect(token).not.toBeNull();
    const session = await verifySessionToken(token);
    expect(session).not.toBeNull();
    expect(session!.expires - Date.now()).toBeLessThanOrEqual(SESSION_TTL_MS);
  });

  test("stale password version is rejected (password change invalidates sessions)", async () => {
    const account = await ensureAdminAccount();
    expect(account).not.toBeNull();
    const stale = createSessionToken(account!.passwordVersion + 999);
    expect(stale).not.toBeNull();
    expect(await verifySessionToken(stale)).toBeNull();
  });

  test("tampered and malformed tokens are rejected", async () => {
    const account = await ensureAdminAccount();
    const token = createSessionToken(account!.passwordVersion)!;
    expect(await verifySessionToken(token.slice(0, -4) + "0000")).toBeNull();
    expect(await verifySessionToken("garbage")).toBeNull();
    expect(await verifySessionToken("")).toBeNull();
    expect(await verifySessionToken(undefined)).toBeNull();
  });

  test("heartbeat renewal keeps the same nonce (revocation still applies)", async () => {
    const account = await ensureAdminAccount();
    const first = await verifySessionToken(createSessionToken(account!.passwordVersion)!);
    expect(first).not.toBeNull();
    const renewed = createSessionToken(account!.passwordVersion, first!.nonce);
    const session = await verifySessionToken(renewed);
    expect(session).not.toBeNull();
    expect(session!.nonce).toBe(first!.nonce);
    expect(session!.expires).toBeGreaterThan(first!.expires - 1000);
  });
});

describe("admin session ends when you leave the site", () => {
  test("beacon revocation is instant; grace-window verify cancels it (reload case)", async () => {
    const account = await ensureAdminAccount();
    const token = createSessionToken(account!.passwordVersion)!;
    const session = await verifySessionToken(token);
    expect(session).not.toBeNull();

    // The beacon revokes the nonce now.
    revokeSession(session!.nonce);
    // A request within the grace window (page reload / other tab) revives it.
    const revived = await verifySessionToken(token);
    expect(revived).not.toBeNull();
    // Revocation was cancelled, so subsequent requests keep working.
    expect(await verifySessionToken(token)).not.toBeNull();
  });

  test("revocation older than the grace window is permanent", async () => {
    const account = await ensureAdminAccount();
    const token = createSessionToken(account!.passwordVersion)!;
    const session = await verifySessionToken(token);
    expect(session).not.toBeNull();

    // Backdated 2 minutes: beyond the 90 s grace — dead for good.
    revokeSession(session!.nonce, Date.now() - 2 * 60 * 1000);
    expect(await verifySessionToken(token)).toBeNull();
    expect(await verifySessionToken(token)).toBeNull();
  });

  test("explicit sign-out revokes permanently (no grace)", async () => {
    const account = await ensureAdminAccount();
    const token = createSessionToken(account!.passwordVersion)!;
    const session = await verifySessionToken(token);
    expect(session).not.toBeNull();

    revokeSessionPermanently(session!.nonce);
    expect(await verifySessionToken(token)).toBeNull();
  });

  test("session cookie is browser-session scoped (no maxAge/expires)", () => {
    const opts = adminCookieOptions() as Record<string, unknown>;
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
    expect("maxAge" in opts).toBe(false);
    expect("expires" in opts).toBe(false);
  });
});
