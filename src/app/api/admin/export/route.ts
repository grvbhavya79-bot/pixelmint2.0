import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminAuth } from "@/lib/server/admin-auth";

/** Escape a CSV cell (RFC 4180: quote fields containing separators/quotes/newlines). */
function csvCell(value: string | number | boolean | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: (string | number | boolean | null)[][]): string {
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(row.map(csvCell).join(","));
  return lines.join("\r\n");
}

function csvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  if (!requireAdminAuth(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const type = new URL(request.url).searchParams.get("type") ?? "";
  const stamp = new Date().toISOString().slice(0, 10);

  switch (type) {
    case "tools": {
      const grouped = await db.toolUsage.groupBy({
        by: ["slug", "status"],
        _count: { _all: true },
        _min: { createdAt: true },
        _max: { createdAt: true },
        orderBy: { _count: { slug: "desc" } },
      });
      const csv = toCsv(
        ["tool_slug", "status", "uses", "first_used", "last_used"],
        grouped.map((g) => [g.slug, g.status, g._count._all, g._min.createdAt?.toISOString() ?? "", g._max.createdAt?.toISOString() ?? ""]),
      );
      return csvResponse(csv, `pixelmint-tool-usage-${stamp}.csv`);
    }
    case "urls": {
      const urls = await db.shortUrl.findMany({ orderBy: { createdAt: "desc" } });
      const csv = toCsv(
        ["short_code", "short_url", "destination_url", "clicks", "active", "expires_at", "created_at"],
        urls.map((u) => {
          const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
          return [u.shortCode, `${origin}/s/${u.shortCode}`, u.destinationUrl, u.clickCount, u.isActive, u.expiresAt?.toISOString() ?? "never", u.createdAt.toISOString()];
        }),
      );
      return csvResponse(csv, `pixelmint-short-links-${stamp}.csv`);
    }
    case "messages": {
      const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
      const csv = toCsv(
        ["name", "email", "subject", "message", "read", "received_at"],
        messages.map((m) => [m.name, m.email, m.subject, m.message, m.isRead, m.createdAt.toISOString()]),
      );
      return csvResponse(csv, `pixelmint-messages-${stamp}.csv`);
    }
    default:
      return NextResponse.json({ success: false, error: "Unknown export type." }, { status: 400 });
  }
}
