"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { ToolBrowser } from "@/components/tools/tool-browser";
import { ALL_TOOLS } from "@/lib/tools/registry";
import { useFavorites } from "@/hooks/use-local-tools";

export default function FavoritesPage() {
  const { loaded } = useFavorites();
  return (
    <div className="container-page py-10">
      <header className="mb-8 text-center">
        <h1 className="flex items-center justify-center gap-2.5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          <Star className="text-amber-500" size={28} aria-hidden="true" /> Your Favorites
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Tools you starred — saved privately in this browser, never uploaded anywhere.
        </p>
      </header>
      {loaded ? (
        <ToolBrowser tools={ALL_TOOLS} showFilters={false} showSearch={false} favoritesOnly />
      ) : (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading your favorites…</div>
      )}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Want more tools? <Link href="/tools" className="font-medium text-primary hover:underline">Browse all 100</Link>
      </p>
    </div>
  );
}
