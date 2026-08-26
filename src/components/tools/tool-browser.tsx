"use client";

import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/tools/categories";
import { searchTools } from "@/lib/tools/registry";
import { ToolCard } from "@/components/tools/tool-card";
import { ToolIcon } from "@/components/tools/tool-icon";
import { cn } from "@/lib/utils";
import { Search, Star } from "lucide-react";
import { useFavorites } from "@/hooks/use-local-tools";
import type { ToolDefinition } from "@/lib/tools/types";

interface ToolBrowserProps {
  tools: ToolDefinition[];
  /** Show category filter chips */
  showFilters?: boolean;
  /** Show search input */
  showSearch?: boolean;
  /** Initial query */
  initialQuery?: string;
  /** Favorites-only mode */
  favoritesOnly?: boolean;
}

export function ToolBrowser({ tools, showFilters = true, showSearch = true, initialQuery = "", favoritesOnly = false }: ToolBrowserProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { favorites } = useFavorites();

  const filtered = useMemo(() => {
    let list = tools;
    if (favoritesOnly) list = list.filter((t) => favorites.includes(t.slug));
    if (activeCategory !== "all") list = list.filter((t) => t.category === activeCategory);
    if (query.trim()) {
      const matching = new Set(searchTools(query, 200).map((t) => t.slug));
      list = list.filter((t) => matching.has(t.slug));
    }
    return list;
  }, [tools, query, activeCategory, favorites, favoritesOnly]);

  return (
    <div>
      {showSearch && (
        <div className="relative mx-auto mb-6 max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tools.length} tools…`}
            aria-label="Search tools by name or keyword"
            className="focus-ring h-11 w-full rounded-xl border bg-card pl-10 pr-4 text-sm shadow-card placeholder:text-muted-foreground"
          />
        </div>
      )}

      {showFilters && (
        <div className="mb-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            aria-pressed={activeCategory === "all"}
            className={cn(
              "focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              activeCategory === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            All ({tools.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = tools.filter((t) => t.category === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                aria-pressed={activeCategory === cat.id}
                className={cn(
                  "focus-ring inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  activeCategory === cat.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <ToolIcon name={cat.icon} size={13} />
                {cat.shortName} ({count})
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/50 px-6 py-16 text-center">
          {favoritesOnly ? (
            <>
              <Star className="mx-auto mb-3 text-muted-foreground/50" size={28} aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">No favorites yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tap the star on any tool card to pin it here for quick access.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tools match your filters. Try a different search term.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} showCategory={activeCategory === "all"} />
          ))}
        </div>
      )}
    </div>
  );
}
