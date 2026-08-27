import type { Metadata } from "next";
import { Star } from "lucide-react";
import { ToolBrowser } from "@/components/tools/tool-browser";
import { getPopularTools } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "Popular Tools — Most Used Free Online Utilities",
  description:
    "The most popular ToolBox100 utilities: merge and compress PDFs, resize images, format JSON, generate passwords and more — all free.",
  alternates: { canonical: "/popular" },
};

export default function PopularPage() {
  const popular = getPopularTools();
  return (
    <div className="container-page py-10">
      <header className="mb-8 text-center">
        <h1 className="flex items-center justify-center gap-2.5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          <Star className="text-amber-500" size={28} aria-hidden="true" /> Popular Tools
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          The {popular.length} tools people use most — hand-picked and battle-tested.
        </p>
      </header>
      <ToolBrowser tools={popular} showFilters={false} showSearch={false} />
    </div>
  );
}
