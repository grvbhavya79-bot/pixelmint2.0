import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIES, categoryCount } from "@/lib/tools/categories";
import { ALL_TOOLS } from "@/lib/tools/registry";
import { ToolIcon } from "@/components/tools/tool-icon";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tool Categories — PDF, Image, Document, Developer & More",
  description:
    "Explore Pixelmint.fun's tool categories: PDF tools, image tools, document & text tools, file tools, developer tools, AI tools, generators and calculators.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <div className="container-page py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Categories</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          {CATEGORIES.length} focused collections that make up the full {ALL_TOOLS.length}-tool workspace.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="focus-ring group flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", category.gradient)}>
              <ToolIcon name={category.icon} size={22} />
            </span>
            <h2 className="mt-4 text-base font-semibold text-foreground group-hover:text-primary">{category.name}</h2>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{category.description}</p>
            <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {categoryCount(category.id, ALL_TOOLS)} tools <ArrowRight size={14} aria-hidden="true" />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
