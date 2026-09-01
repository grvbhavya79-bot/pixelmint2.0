import { NextResponse } from "next/server";
import { z } from "zod";
import {
  requireAdminAuth, getAdminAccount, publicAccount, isBootstrapPasswordActive,
} from "@/lib/server/admin-auth";

/** Dashboard customization + account info. */
export async function GET(request: Request) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const account = await getAdminAccount();
  if (!account) {
    return NextResponse.json({ success: false, error: "No admin account." }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    settings: {
      ...publicAccount(account),
      bootstrapPasswordActive: await isBootstrapPasswordActive(),
    },
  });
}

const patchSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  displayName: z.string().trim().min(1).max(60).optional(),
  panelTitle: z.string().trim().min(1).max(60).optional(),
  panelTagline: z.string().trim().max(140).optional(),
});

/** Update panel customization. Only provided fields are changed. */
export async function PATCH(request: Request) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Names must be 1-60 characters; username 3-32 (letters, numbers, dashes); tagline up to 140." },
      { status: 400 },
    );
  }
  const data = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: false, error: "Nothing to update." }, { status: 400 });
  }

  const { db } = await import("@/lib/db");
  try {
    const updated = await db.adminAccount.update({ where: { id: "primary" }, data });
    return NextResponse.json({
      success: true,
      settings: {
        ...publicAccount(updated),
        bootstrapPasswordActive: await isBootstrapPasswordActive(),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Could not save settings." }, { status: 500 });
  }
}
