"use client";

import { Star } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/use-local-tools";
import { cn } from "@/lib/utils";

export function FavoriteButton({ slug, name }: { slug: string; name: string }) {
  const { isFavorite, toggle } = useFavorites();
  const favorite = isFavorite(slug);
  return (
    <button
      type="button"
      onClick={() => {
        toggle(slug);
        toast.success(favorite ? `${name} removed from favorites` : `${name} added to favorites`);
      }}
      aria-pressed={favorite}
      aria-label={favorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
        favorite
          ? "border-amber-400/60 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      <Star size={14} className={favorite ? "fill-amber-400 text-amber-400" : ""} />
      {favorite ? "Favorited" : "Add to favorites"}
    </button>
  );
}
