import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminAuth } from "@/lib/server/admin-auth";

/** List contact messages. */
export async function GET(request: Request) {
  if (!requireAdminAuth(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const messages = await db.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ success: true, messages });
}

/** Mark message as read/unread — or all messages at once with { all: true }. */
export async function PATCH(request: Request) {
  if (!requireAdminAuth(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);

  // Mark ALL messages as read: { all: true }
  if (body?.all === true) {
    const result = await db.contactMessage.updateMany({ data: { isRead: true } });
    return NextResponse.json({ success: true, updated: result.count });
  }

  const id = typeof body?.id === "string" ? body.id : null;
  const isRead = typeof body?.isRead === "boolean" ? body.isRead : null;
  if (!id || isRead === null) {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
  try {
    const updated = await db.contactMessage.update({ where: { id }, data: { isRead } });
    return NextResponse.json({ success: true, message: { id: updated.id, isRead: updated.isRead } });
  } catch {
    return NextResponse.json({ success: false, error: "Message not found." }, { status: 404 });
  }
}

/** Delete a message. */
export async function DELETE(request: Request) {
  if (!requireAdminAuth(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
  try {
    await db.contactMessage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Message not found." }, { status: 404 });
  }
}
