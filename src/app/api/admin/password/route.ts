import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE, requireAdminAuth, createSessionToken, getAdminAccount, verifyPasswordHash,
  hashPassword, validatePasswordStrength, publicAccount, isBootstrapPasswordActive,
} from "@/lib/server/admin-auth";
import { db } from "@/lib/db";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/server/rate-limit";

const schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(1).max(200),
});

/**
 * Self-service password change.
 * - Requires an active session AND the current password (re-authentication).
 * - Strength-checked; must differ from the current password.
 * - Bumps passwordVersion: every other session is signed out instantly,
 *   while this session is re-issued a fresh token so the admin stays
 *   logged in.
 */
export async function POST(request: Request) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const limit = rateLimit(
    `admin-pw-change:${ip}`,
    RATE_LIMITS.adminPasswordChange.limit,
    RATE_LIMITS.adminPasswordChange.windowMs,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many attempts — please wait 15 minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Enter your current and new password." }, { status: 400 });
  }

  const account = await getAdminAccount();
  if (!account) {
    return NextResponse.json({ success: false, error: "No admin account." }, { status: 404 });
  }

  const { currentPassword, newPassword } = parsed.data;
  if (!verifyPasswordHash(currentPassword, account.passwordHash)) {
    console.warn(`[admin] Failed password change (wrong current password) from ${ip} at ${new Date().toISOString()}`);
    return NextResponse.json({ success: false, error: "Current password is incorrect." }, { status: 401 });
  }
  if (verifyPasswordHash(newPassword, account.passwordHash)) {
    return NextResponse.json({ success: false, error: "The new password must be different from the current one." }, { status: 400 });
  }
  const strength = validatePasswordStrength(newPassword);
  if (!strength.ok) {
    return NextResponse.json({ success: false, error: strength.reason }, { status: 400 });
  }

  const updated = await db.adminAccount.update({
    where: { id: account.id },
    data: {
      passwordHash: hashPassword(newPassword),
      passwordVersion: { increment: 1 },
      passwordChangedAt: new Date(),
    },
  });

  const token = createSessionToken(updated.passwordVersion);
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Password changed, but the session could not be re-issued — sign in again." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({
    success: true,
    message: "Password updated. Other sessions have been signed out.",
    settings: {
      ...publicAccount(updated),
      bootstrapPasswordActive: await isBootstrapPasswordActive(),
    },
  });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 3600,
  });
  return response;
}
