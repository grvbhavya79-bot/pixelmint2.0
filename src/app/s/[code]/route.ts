import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/server/rate-limit";

/**
 * Short URL redirect: /s/[code]
 * - validates the code format (path traversal protection)
 * - honors expiry + active flags
 * - counts clicks and referral, then 302 redirects
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const ip = getClientIp(request);
  const limit = rateLimit(`resolve:${ip}`, RATE_LIMITS.shortenerResolve.limit, RATE_LIMITS.shortenerResolve.windowMs);
  if (!limit.allowed) {
    return new NextResponse("Too many requests. Please slow down.", { status: 429 });
  }

  if (!/^[a-zA-Z0-9_-]{3,40}$/.test(code)) {
    return new NextResponse("Invalid short link.", { status: 400 });
  }

  const link = await db.shortUrl.findUnique({
    where: { shortCode: code.toLowerCase() === code ? code : code },
  });
  if (!link || !link.isActive) {
    return new NextResponse("This short link doesn't exist or was disabled.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    return new NextResponse("This short link has expired.", { status: 410 });
  }

  // fire-and-forget click counting
  void db.shortUrl
    .update({ where: { id: link.id }, data: { clickCount: { increment: 1 } } })
    .then((updated) =>
      db.shortUrlClick.create({
        data: {
          shortUrlId: updated.id,
          referrer: request.headers.get("referer")?.slice(0, 500) ?? null,
        },
      }),
    )
    .catch(() => {});

  return NextResponse.redirect(link.destinationUrl, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
