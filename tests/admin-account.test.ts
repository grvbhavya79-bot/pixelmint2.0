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
    expect(await verifySessionToken(t1)).toBe(true);
    expect(await verifySessionToken(t2)).toBe(true);
  });

  test("stale password version is rejected (password change invalidates sessions)", async () => {
    const account = await ensureAdminAccount();
    expect(account).not.toBeNull();
    const stale = createSessionToken(account!.passwordVersion + 999);
    expect(stale).not.toBeNull();
    expect(await verifySessionToken(stale)).toBe(false);
  });

  test("tampered and malformed tokens are rejected", async () => {
    const account = await ensureAdminAccount();
    const token = createSessionToken(account!.passwordVersion)!;
    expect(await verifySessionToken(token.slice(0, -4) + "0000")).toBe(false);
    expect(await verifySessionToken("garbage")).toBe(false);
    expect(await verifySessionToken("")).toBe(false);
    expect(await verifySessionToken(undefined)).toBe(false);
  });
});
