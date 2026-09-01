import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE, requireAdminAuth, createSessionToken, adminCookieOptions, SESSION_TTL_MS,
} from "@/lib/server/admin-auth";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/server/rate-limit";

/**
 * Session heartbeat sent by the dashboard while it is open (~every 45 s).
 * Re-issues the token with a fresh expiry (sliding session) using the SAME
 * nonce, so revocation keeps working across renewals. If the session has
 * already expired the client receives a 401 and returns to the sign-in
 * screen — this is what ends idle sessions ~30 minutes after the site
 * is left.
 */
export async function POST(request: Request) {
  const session = await requireAdminAuth(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Session expired." }, { status: 401 });
  }

  const limit = rateLimit(
    `admin-heartbeat:${getClientIp(request)}`,
    RATE_LIMITS.adminHeartbeat.limit,
    RATE_LIMITS.adminHeartbeat.windowMs,
  );
  if (!limit.allowed) {
    return NextResponse.json({ success: false }, { status: 429 });
  }

  const token = createSessionToken(session.passwordVersion, session.nonce);
  if (!token) {
    return NextResponse.json({ success: false, error: "Session could not be renewed." }, { status: 500 });
  }

  const response = NextResponse.json({
    success: true,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  });
  response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return response;
}
