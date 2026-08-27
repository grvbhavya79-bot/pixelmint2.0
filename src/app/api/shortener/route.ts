import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/server/rate-limit";
import { checkDestinationUrl } from "@/lib/server/url-safety";
import { generateShortCode } from "@/lib/server/admin-auth";

const createSchema = z.object({
  url: z.string().min(4).max(2048),
  customCode: z.string().regex(/^[a-zA-Z0-9_-]{4,32}$/).optional(),
  expiresInDays: z.number().int().min(1).max(3650).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`shorten:${ip}`, RATE_LIMITS.shortenerCreate.limit, RATE_LIMITS.shortenerCreate.windowMs);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: `Too many links created — try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).` },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Custom codes must be 4-32 characters (letters, numbers, dashes)." },
      { status: 400 },
    );
  }

  const check = checkDestinationUrl(parsed.data.url);
  if (!check.ok) {
    return NextResponse.json({ success: false, error: check.reason }, { status: 400 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  try {
    let shortCode = parsed.data.customCode;
    if (shortCode) {
      const existing = await db.shortUrl.findUnique({ where: { shortCode } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "That short code is already taken — pick another one." },
          { status: 409 },
        );
      }
    } else {
      // generate a unique code
      for (let attempt = 0; attempt < 6; attempt++) {
        const candidate = generateShortCode(6);
        const exists = await db.shortUrl.findUnique({ where: { shortCode: candidate } });
        if (!exists) {
          shortCode = candidate;
          break;
        }
      }
      if (!shortCode) {
        return NextResponse.json({ success: false, error: "Could not generate a code — please retry." }, { status: 500 });
      }
    }

    const created = await db.shortUrl.create({
      data: {
        shortCode,
        destinationUrl: check.url!,
        expiresAt: parsed.data.expiresInDays
          ? new Date(Date.now() + parsed.data.expiresInDays * 86400000)
          : null,
      },
    });

    return NextResponse.json({
      success: true,
      link: {
        shortCode: created.shortCode,
        shortUrl: `${origin}/s/${created.shortCode}`,
        destination: created.destinationUrl,
        expiresAt: created.expiresAt?.toISOString() ?? null,
        clicks: 0,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "The link could not be created. Please try again." },
      { status: 500 },
    );
  }
}
