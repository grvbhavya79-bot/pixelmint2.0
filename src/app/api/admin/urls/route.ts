import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/server/admin-auth";

async function requireAuth(request: Request): Promise<boolean> {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`));
  return verifySessionToken(match?.[1]);
}

/** List short URLs with optional search. */
export async function GET(request: Request) {
  if (!(await requireAuth(request))) {
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

/** Toggle active status. */
export async function PATCH(request: Request) {
  if (!(await requireAuth(request))) {
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
  if (!(await requireAuth(request))) {
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
