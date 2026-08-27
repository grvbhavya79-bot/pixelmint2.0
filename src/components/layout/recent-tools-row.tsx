"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useRecents } from "@/hooks/use-local-tools";
import { getTool, type ToolDefinition } from "@/lib/tools/registry";
import { ToolIcon } from "@/components/tools/tool-icon";

/** Shows the visitor's recently used tools (stored locally, identifiers only). */
export function RecentToolsRow() {
  const { recents, loaded } = useRecents();
  if (!loaded || recents.length === 0) return null;

  const tools = recents.map(getTool).filter((t): t is ToolDefinition => t !== undefined);
  if (tools.length === 0) return null;

  return (
    <section className="border-b bg-card/60 py-4" aria-labelledby="recent-heading">
      <div className="container-page flex items-center gap-4 overflow-x-auto scrollbar-thin">
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Clock3 size={13} aria-hidden="true" /> Recently used
        </span>
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="focus-ring flex shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <ToolIcon name={tool.icon} size={13} className="text-primary" />
            {tool.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
