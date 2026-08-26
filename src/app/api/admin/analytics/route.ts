import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/server/admin-auth";

async function requireAuth(request: Request): Promise<boolean> {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`));
  return verifySessionToken(match?.[1]);
}

export async function GET(request: Request) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86400000);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const [
    totalUses,
    dailyUses,
    weeklyUses,
    monthlyUses,
    failedUses,
    popularTools,
    dailyTrafficRaw,
    categoryTrafficRaw,
    urlStats,
    messageStats,
  ] = await Promise.all([
    db.toolUsage.count(),
    db.toolUsage.count({ where: { createdAt: { gte: dayAgo } } }),
    db.toolUsage.count({ where: { createdAt: { gte: weekAgo } } }),
    db.toolUsage.count({ where: { createdAt: { gte: monthAgo } } }),
    db.toolUsage.count({ where: { status: "error" } }),
    db.toolUsage.groupBy({ by: ["slug"], _count: { slug: true }, orderBy: { _count: { slug: "desc" } }, take: 10 }),
    db.toolUsage.findMany({
      where: { createdAt: { gte: new Date(now.getTime() - 14 * 86400000) } },
      select: { createdAt: true },
    }),
    db.toolUsage.findMany({ where: { createdAt: { gte: monthAgo } }, select: { slug: true } }),
    db.shortUrl.aggregate({ _count: true, _sum: { clickCount: true } }),
    db.contactMessage.count(),
  ]);

  // bucket daily traffic into last 14 days
  const trafficMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    trafficMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const usage of dailyTrafficRaw) {
    const key = usage.createdAt.toISOString().slice(0, 10);
    if (trafficMap.has(key)) trafficMap.set(key, (trafficMap.get(key) ?? 0) + 1);
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
      totalShortUrls: urlStats._count,
      totalShortUrlClicks: urlStats._sum.clickCount ?? 0,
      unreadMessages: messageStats,
      popularTools: popularTools.map((p) => ({ slug: p.slug, count: p._count.slug })),
      dailyTraffic: [...trafficMap.entries()].map(([date, count]) => ({ date, count })),
      categoryTraffic: [...catCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({ category, count })),
    },
  });
}
