"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchTools } from "@/lib/tools/registry";
import { ToolIcon } from "@/components/tools/tool-icon";
import { CATEGORY_BY_ID } from "@/lib/tools/categories";
import { cn } from "@/lib/utils";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const results = searchTools(query, 6);

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (results.length > 0) router.push(`/tools/${results[0].slug}`);
        }}
      >
        <label htmlFor="hero-search" className="sr-only">Search tools</label>
        <div className="flex items-center rounded-2xl border bg-card px-4 shadow-card transition-shadow focus-within:shadow-card-hover focus-within:ring-2 focus-within:ring-ring">
          <Search className="shrink-0 text-muted-foreground" size={19} aria-hidden="true" />
          <input
            id="hero-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools… (e.g. compress, jpg, merge)"
            className="h-13 w-full bg-transparent px-3.5 py-4 text-sm outline-none placeholder:text-muted-foreground sm:text-base"
            autoComplete="off"
          />
          <Button type="submit" disabled={!query.trim() || results.length === 0} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
            Search
          </Button>
        </div>
      </form>

      {query.trim() !== "" && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border bg-popover shadow-card-hover">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No tools match “{query}”.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto scrollbar-thin">
              {results.map((tool) => (
                <li key={tool.slug}>
                  <button
                    type="button"
                    onClick={() => router.push(`/tools/${tool.slug}`)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <ToolIcon name={tool.icon} size={16} className="text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{tool.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{tool.description}</span>
                    </span>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px]", CATEGORY_BY_ID[tool.category].chip)}>
                      {CATEGORY_BY_ID[tool.category].shortName}
                    </span>
                    <ArrowRight size={13} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
