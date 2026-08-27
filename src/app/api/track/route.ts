import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/server/rate-limit";

const schema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  status: z.enum(["success", "error"]).default("success"),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`track:${ip}`, RATE_LIMITS.track.limit, RATE_LIMITS.track.windowMs);
    if (!limit.allowed) return NextResponse.json({ success: false }, { status: 429 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false }, { status: 400 });

    await db.toolUsage.create({
      data: { slug: parsed.data.slug, status: parsed.data.status },
    });
    return NextResponse.json({ success: true });
  } catch {
    // analytics must never fail loudly
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
