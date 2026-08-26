"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { ToolIcon } from "@/components/tools/tool-icon";
import { CATEGORY_BY_ID } from "@/lib/tools/categories";
import { useFavorites } from "@/hooks/use-local-tools";
import type { ToolDefinition } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

export function ToolCard({ tool, showCategory = true }: { tool: ToolDefinition; showCategory?: boolean }) {
  const category = CATEGORY_BY_ID[tool.category];
  const { isFavorite, toggle } = useFavorites();
  const favorite = isFavorite(tool.slug);

  return (
    <div className="group relative rounded-xl border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <Link
        href={`/tools/${tool.slug}`}
        className="focus-ring block rounded-xl p-4 sm:p-5"
        aria-label={`${tool.name} — ${tool.description}`}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
              category.gradient,
            )}
          >
            <ToolIcon name={tool.icon} size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
              {tool.name}
            </h3>
            {showCategory && (
              <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium", category.chip)}>
                {category.shortName}
              </span>
            )}
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggle(tool.slug);
        }}
        aria-label={favorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
        aria-pressed={favorite}
        className="focus-ring absolute right-2.5 top-2.5 rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:text-amber-500"
      >
        <Star size={15} className={favorite ? "fill-amber-400 text-amber-400" : ""} />
      </button>
    </div>
  );
}
