"use client";

import { Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { TOOL_COMPONENTS } from "@/components/tools/registry-components";
import { CATEGORY_BY_ID } from "@/lib/tools/categories";
import type { ToolDefinition } from "@/lib/tools/types";
import { pushRecent } from "@/hooks/use-local-tools";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

function ToolSkeleton() {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border bg-card" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="animate-spin text-primary" size={22} />
        <p className="text-sm">Loading tool…</p>
      </div>
    </div>
  );
}

export function ToolWorkspace({ tool }: { tool: ToolDefinition }) {
  const Component = TOOL_COMPONENTS[tool.component];

  useEffect(() => {
    pushRecent(tool.slug);
  }, [tool.slug]);

  const category = CATEGORY_BY_ID[tool.category];

  return (
    <div className="space-y-5">
      {tool.process === "local" && (
        <div className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success/5 px-4 py-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-success" size={16} aria-hidden="true" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Private processing:</span> this {category.shortName.toLowerCase()} tool runs
            entirely in your browser — your files never leave your device.
          </p>
        </div>
      )}

      <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-6">
        <Suspense fallback={<ToolSkeleton />}>
          {Component ? (
            <Component {...(tool.props ?? {})} />
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">This tool is not available yet.</p>
          )}
        </Suspense>
      </div>
    </div>
  );
}

export function ToolBadge({ tool }: { tool: ToolDefinition }) {
  const category = CATEGORY_BY_ID[tool.category];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", category.chip)}>
      {category.name}
    </span>
  );
}
