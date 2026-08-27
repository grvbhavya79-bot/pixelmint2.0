import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, checkAdminPassword, createSessionToken } from "@/lib/server/admin-auth";
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

  if (!checkAdminPassword(parsed.data.password)) {
    return NextResponse.json({ success: false, error: "Incorrect password." }, { status: 401 });
  }

  const token = createSessionToken();
  const response = NextResponse.json({ success: true });
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
