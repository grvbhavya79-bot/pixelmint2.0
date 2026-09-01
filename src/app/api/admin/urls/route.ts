import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdminAuth, generateShortCode } from "@/lib/server/admin-auth";
import { checkDestinationUrl } from "@/lib/server/url-safety";

/** List short URLs with optional search. */
export async function GET(request: Request) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const search = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const urls = await db.shortUrl.findMany({
    where: search
      ? {
          OR: [
            { shortCode: { contains: search } },
            { destinationUrl: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      shortCode: true,
      destinationUrl: true,
      clickCount: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ success: true, urls });
}

const createSchema = z.object({
  url: z.string().min(4).max(2048),
  customCode: z.string().regex(/^[a-zA-Z0-9_-]{4,32}$/).optional(),
  expiresInDays: z.number().int().min(1).max(3650).optional(),
});

/** Create a short link from the admin dashboard (bypasses public rate limit). */
export async function POST(request: Request) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

  try {
    let shortCode = parsed.data.customCode;
    if (shortCode) {
      const existing = await db.shortUrl.findUnique({ where: { shortCode } });
      if (existing) {
        return NextResponse.json({ success: false, error: "That short code is already taken." }, { status: 409 });
      }
    } else {
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

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    return NextResponse.json({
      success: true,
      link: { shortCode: created.shortCode, shortUrl: `${origin}/s/${created.shortCode}` },
    });
  } catch {
    return NextResponse.json({ success: false, error: "The link could not be created." }, { status: 500 });
  }
}

/** Toggle active status. */
export async function PATCH(request: Request) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  const isActive = typeof body?.isActive === "boolean" ? body.isActive : null;
  if (!id || isActive === null) {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
  try {
    const updated = await db.shortUrl.update({ where: { id }, data: { isActive } });
    return NextResponse.json({ success: true, url: { id: updated.id, isActive: updated.isActive } });
  } catch {
    return NextResponse.json({ success: false, error: "Link not found." }, { status: 404 });
  }
}

/** Delete a short URL. */
export async function DELETE(request: Request) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
  try {
    await db.shortUrl.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Link not found." }, { status: 404 });
  }
}
