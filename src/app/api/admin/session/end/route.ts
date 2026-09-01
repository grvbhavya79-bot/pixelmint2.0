import { NextResponse } from "next/server";
import { requireAdminAuth, revokeSession } from "@/lib/server/admin-auth";

/**
 * Beacon endpoint called with navigator.sendBeacon() when the dashboard is
 * closed, navigated away from, or the browser exits. Revokes the session
 * nonce immediately, so the session ends as soon as the admin leaves the
 * site.
 *
 * A short grace window (see admin-auth.ts) automatically cancels the
 * revocation if an authenticated request arrives moments later — that is
 * the page-reload case (F5) and multi-tab case, so refreshing never signs
 * you out. After the grace window the revocation is permanent.
 *
 * Notes:
 * - sendBeacon cannot set headers, but the httpOnly session cookie is
 *   attached automatically for same-origin POSTs.
 * - The request may carry an empty/absent body; it is never parsed.
 * - A 204 is returned because beacons ignore response bodies.
 * - CSRF: cross-site beacons do not carry the SameSite=Lax cookie.
 */
export async function POST(request: Request) {
  const session = await requireAdminAuth(request);
  if (session) {
    revokeSession(session.nonce);
  }
  // Always answer 204 — a beacon caller cannot read the response anyway,
  // and we must not leak whether a session existed.
  return new NextResponse(null, { status: 204 });
}
