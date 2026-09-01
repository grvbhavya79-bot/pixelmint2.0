import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminAuth } from "@/lib/server/admin-auth";

const ALLOWED_WINDOWS = [7, 14, 30, 90] as const;
const DAY_MS = 86_400_000;

export async function GET(request: Request) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const rawDays = Number(new URL(request.url).searchParams.get("days"));
  const days = (ALLOWED_WINDOWS as readonly number[]).includes(rawDays) ? rawDays : 30;

  const now = new Date();
  const dayAgo = new Date(now.getTime() - DAY_MS);
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const monthAgo = new Date(now.getTime() - 30 * DAY_MS);
  const windowAgo = new Date(now.getTime() - days * DAY_MS);

  const [
    totalUses,
    dailyUses,
    weeklyUses,
    monthlyUses,
    failedUses,
    distinctTools,
    totalMessages,
    unreadMessages,
    popularTools,
    dailyTrafficRaw,
    categoryTrafficRaw,
    urlStats,
  ] = await Promise.all([
    db.toolUsage.count(),
    db.toolUsage.count({ where: { createdAt: { gte: dayAgo } } }),
    db.toolUsage.count({ where: { createdAt: { gte: weekAgo } } }),
    db.toolUsage.count({ where: { createdAt: { gte: monthAgo } } }),
    db.toolUsage.count({ where: { status: "error" } }),
    db.toolUsage.findMany({ select: { slug: true }, distinct: ["slug"] }),
    db.contactMessage.count(),
    db.contactMessage.count({ where: { isRead: false } }),
    db.toolUsage.groupBy({
      by: ["slug"],
      _count: { slug: true },
      where: { createdAt: { gte: windowAgo } },
      orderBy: { _count: { slug: "desc" } },
      take: 10,
    }),
    db.toolUsage.findMany({
      where: { createdAt: { gte: windowAgo } },
      select: { createdAt: true },
    }),
    db.toolUsage.findMany({ where: { createdAt: { gte: windowAgo } }, select: { slug: true } }),
    db.shortUrl.aggregate({ _count: true, _sum: { clickCount: true } }),
  ]);

  // Bucket traffic: daily for windows up to 30 days, weekly above that.
  const bucketMs = days > 30 ? 7 * DAY_MS : DAY_MS;
  const bucketCount = Math.ceil(days / (bucketMs / DAY_MS));
  const windowStart = now.getTime() - days * DAY_MS;
  const trafficMap = new Map<string, number>();
  for (let i = 0; i < bucketCount; i++) {
    const d = new Date(windowStart + i * bucketMs);
    trafficMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const usage of dailyTrafficRaw) {
    const idx = Math.floor((usage.createdAt.getTime() - windowStart) / bucketMs);
    if (idx < 0 || idx >= bucketCount) continue;
    const key = new Date(windowStart + idx * bucketMs).toISOString().slice(0, 10);
    trafficMap.set(key, (trafficMap.get(key) ?? 0) + 1);
  }

  // map slug → category
  const { ALL_TOOLS, CATEGORY_BY_ID } = await import("@/lib/tools/registry");
  const slugToCategory = new Map(ALL_TOOLS.map((t) => [t.slug, t.category]));
  const catCount = new Map<string, number>();
  for (const usage of categoryTrafficRaw) {
    const cat = slugToCategory.get(usage.slug);
    if (cat) {
      const name = CATEGORY_BY_ID[cat].name;
      catCount.set(name, (catCount.get(name) ?? 0) + 1);
    }
  }

  return NextResponse.json({
    success: true,
    stats: {
      totalUses,
      dailyUses,
      weeklyUses,
      monthlyUses,
      failedUses,
      successRate: totalUses > 0 ? Math.round(((totalUses - failedUses) / totalUses) * 100) : null,
      uniqueToolsUsed: distinctTools.length,
      totalShortUrls: urlStats._count,
      totalShortUrlClicks: urlStats._sum.clickCount ?? 0,
      totalMessages,
      unreadMessages,
      popularTools: popularTools.map((p) => ({ slug: p.slug, count: p._count.slug })),
      dailyTraffic: [...trafficMap.entries()].map(([date, count]) => ({ date, count })),
      categoryTraffic: [...catCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({ category, count })),
      windowDays: days,
    },
  });
}
