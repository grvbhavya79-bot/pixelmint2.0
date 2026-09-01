import { NextResponse } from "next/server";
import { stat } from "fs/promises";
import { db } from "@/lib/db";
import {
  requireAdminAuth, isAdminConfigured, isBootstrapPasswordActive, publicAccount, getAdminAccount,
} from "@/lib/server/admin-auth";
import { getTool } from "@/lib/tools/registry";

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export async function GET(request: Request) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const [toolEvents, messageEvents, clickEvents, recentErrors, account] = await Promise.all([
    db.toolUsage.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { name: true, subject: true, isRead: true, createdAt: true } }),
    db.shortUrlClick.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { createdAt: true, shortUrl: { select: { shortCode: true } } },
    }),
    db.toolUsage.findMany({ where: { status: "error" }, orderBy: { createdAt: "desc" }, take: 10 }),
    getAdminAccount(),
  ]);

  // Unified activity feed: tool runs, incoming messages, short-link clicks.
  const activity = [
    ...toolEvents.map((e) => ({
      type: "tool" as const,
      label: getTool(e.slug)?.name ?? e.slug,
      detail: e.status,
      at: e.createdAt.toISOString(),
    })),
    ...messageEvents.map((m) => ({
      type: "message" as const,
      label: `Message from ${m.name}`,
      detail: m.subject,
      at: m.createdAt.toISOString(),
    })),
    ...clickEvents.map((c) => ({
      type: "click" as const,
      label: `/s/${c.shortUrl.shortCode}`,
      detail: "Short-link visit",
      at: c.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, 15);

  // Database file size (best-effort — non-fatal if path unavailable).
  let dbSizeBytes: number | null = null;
  try {
    const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "");
    if (dbPath) dbSizeBytes = (await stat(dbPath)).size;
  } catch {
    dbSizeBytes = null;
  }

  const mem = process.memoryUsage?.() ?? null;

  return NextResponse.json({
    success: true,
    overview: {
      server: {
        runtime: process.versions?.bun
          ? `Bun ${process.versions.bun}`
          : `Node.js ${process.version}`,
        uptime: formatUptime(process.uptime()),
        memoryUsedMb: mem ? Math.round(mem.rss / 1048576) : null,
        heapUsedMb: mem ? Math.round(mem.heapUsed / 1048576) : null,
        nodeEnv: process.env.NODE_ENV ?? "development",
        dbSizeBytes,
      },
      config: {
        // Boolean-only status flags — never expose values.
        adminAccountActive: await isAdminConfigured(),
        adminSecretSet: Boolean(process.env.ADMIN_SECRET),
        siteUrlSet: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
        emailConfigured: Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM),
        bootstrapPasswordActive: await isBootstrapPasswordActive(),
      },
      account: account ? publicAccount(account) : null,
      recentActivity: activity,
      recentErrors: recentErrors.map((a) => ({
        slug: a.slug,
        toolName: getTool(a.slug)?.name ?? a.slug,
        at: a.createdAt.toISOString(),
      })),
    },
  });
}
