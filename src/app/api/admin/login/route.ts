import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  ADMIN_COOKIE, createSessionToken, isAdminConfigured, verifyAdminLogin, publicAccount,
  adminCookieOptions, requireAdminAuth, revokeSessionPermanently,
} from "@/lib/server/admin-auth";
import { peekLimit, recordFailure, clearFailures, getClientIp, RATE_LIMITS } from "@/lib/server/rate-limit";

const schema = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const key = `admin-login:${ip}`;
  const loginLimit = RATE_LIMITS.adminLogin;

  // Lockout counts FAILED attempts only — signing in successfully with the
  // correct password never counts and never locks you out. A successful
  // sign-in also clears past failures for this IP.
  const lock = peekLimit(key);
  if (lock && lock.count >= loginLimit.limit) {
    const minutes = Math.max(1, Math.ceil((lock.resetAt - Date.now()) / 60_000));
    return NextResponse.json(
      {
        success: false,
        error: `Too many failed password attempts — please wait ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      },
      { status: 429 },
    );
  }

  // Fail closed: if no password is configured on this server, admin access
  // is disabled entirely (no default password exists).
  if (!(await isAdminConfigured())) {
    return NextResponse.json(
      { success: false, error: "Admin login is disabled on this server." },
      { status: 503 },
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
    return NextResponse.json({ success: false, error: "Enter the admin password." }, { status: 400 });
  }

  const account = await verifyAdminLogin(parsed.data.password);
  if (!account) {
    recordFailure(key, loginLimit.windowMs);
    console.warn(`[admin] Failed login attempt from ${ip} at ${new Date().toISOString()}`);
    return NextResponse.json({ success: false, error: "Incorrect password." }, { status: 401 });
  }

  // Success: wipe this IP's failure history so legit sign-ins never lock out.
  clearFailures(key);

  const token = createSessionToken(account.passwordVersion);
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Server misconfiguration: ADMIN_SECRET missing." },
      { status: 500 },
    );
  }

  // Record the sign-in (best effort — never blocks the login).
  await db.adminAccount
    .update({ where: { id: account.id }, data: { lastLoginAt: new Date() } })
    .catch(() => undefined);

  const response = NextResponse.json({
    success: true,
    account: publicAccount({ ...account, lastLoginAt: new Date() }),
  });
  // Browser-session cookie: no maxAge, so closing the browser deletes it.
  // The token itself expires after 30 idle minutes and is kept alive by
  // the dashboard heartbeat only while the dashboard is open.
  response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return response;
}

export async function DELETE(request: Request) {
  // Hard-revoke the session server-side (no grace window), then clear the
  // cookie — a saved/copied token cannot be reused after sign-out.
  const session = await requireAdminAuth(request);
  if (session) revokeSessionPermanently(session.nonce);
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
