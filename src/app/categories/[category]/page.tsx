import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CATEGORY_BY_SLUG, CATEGORIES, categoryCount } from "@/lib/tools/categories";
import { ALL_TOOLS, getToolsByCategory } from "@/lib/tools/registry";
import { ToolBrowser } from "@/components/tools/tool-browser";
import { ToolIcon } from "@/components/tools/tool-icon";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORY_BY_SLUG[category];
  if (!cat) return {};
  return {
    title: `${cat.name} — ${categoryCount(cat.id, ALL_TOOLS)} Free Online Tools`,
    description: cat.description,
    alternates: { canonical: `/categories/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = CATEGORY_BY_SLUG[category];
  if (!cat) notFound();
  const tools = getToolsByCategory(cat.id);

  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-primary">Home</Link></li>
          <li aria-hidden="true"><ChevronRight size={12} /></li>
          <li><Link href="/categories" className="hover:text-primary">Categories</Link></li>
          <li aria-hidden="true"><ChevronRight size={12} /></li>
          <li aria-current="page" className="font-medium text-foreground">{cat.name}</li>
        </ol>
      </nav>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className={cn("flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", cat.gradient)}>
            <ToolIcon name={cat.icon} size={26} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{cat.name}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{cat.description}</p>
          </div>
        </div>
        <span className="rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground">
          {tools.length} tools
        </span>
      </header>

      <ToolBrowser tools={tools} showFilters={false} />
    </div>
  );
}
