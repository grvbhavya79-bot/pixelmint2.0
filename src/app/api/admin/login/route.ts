import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  ADMIN_COOKIE, createSessionToken, isAdminConfigured, verifyAdminLogin, publicAccount,
} from "@/lib/server/admin-auth";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/server/rate-limit";

const schema = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`admin-login:${ip}`, RATE_LIMITS.adminLogin.limit, RATE_LIMITS.adminLogin.windowMs);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many attempts — please wait 15 minutes." },
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
    console.warn(`[admin] Failed login attempt from ${ip} at ${new Date().toISOString()}`);
    return NextResponse.json({ success: false, error: "Incorrect password." }, { status: 401 });
  }

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
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 3600,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
