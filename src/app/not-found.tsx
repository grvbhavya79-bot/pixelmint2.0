import Link from "next/link";
import { Search } from "lucide-react";
import { getPopularTools } from "@/lib/tools/registry";
import { ToolCard } from "@/components/tools/tool-card";

export default function NotFound() {
  const suggestions = getPopularTools().slice(0, 4);
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <p className="font-mono text-7xl font-bold text-gradient">404</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">This page doesn't exist</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for may have been renamed or never existed. Try a search or jump to one of these popular tools:
      </p>
      <Link
        href="/tools"
        className="focus-ring mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90"
      >
        <Search size={15} aria-hidden="true" /> Browse all tools
      </Link>
      <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {suggestions.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </div>
  );
}
