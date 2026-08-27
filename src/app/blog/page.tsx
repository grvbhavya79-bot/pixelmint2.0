import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { POSTS } from "@/lib/blog/posts";
import { ToolIcon } from "@/components/tools/tool-icon";
import { getTool } from "@/lib/tools/registry";
import { CATEGORY_BY_ID } from "@/lib/tools/categories";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog — Guides, Tutorials & Productivity Tips",
  description:
    "Practical guides for PDFs, images, file conversion and everyday productivity — written to help you get more done with free online tools.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Pixelmint.fun Blog — Guides & Tutorials",
    description: "Practical guides for PDFs, images, file conversion and everyday productivity.",
    url: "/blog",
    type: "website",
  },
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function BlogIndexPage() {
  const [featured, ...rest] = POSTS;

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-1.5 w-1.5 rounded-[2px] bg-primary" aria-hidden="true" />
          The Pixelmint Blog
        </p>
        <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Guides that get things done.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Short, practical articles about PDFs, images, file conversion and everyday
          productivity — every guide links to the free tools that do the work.
        </p>
      </header>

      {/* Featured post */}
      <article className="card-lift mt-10 overflow-hidden rounded-2xl border bg-card shadow-card hover:shadow-card-hover">
        <div className="grid gap-0 md:grid-cols-5">
          <div className="relative flex min-h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-secondary to-background p-8 md:col-span-2">
            <div className="bg-pixel-grid absolute inset-0 opacity-60" aria-hidden="true" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-mint">
              <ToolIcon name={getTool(featured.relatedTools[0])?.icon ?? "FileText"} size={28} />
            </span>
          </div>
          <div className="p-6 md:col-span-3 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">
                Featured · {featured.category}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={12} aria-hidden="true" /> {formatDate(featured.date)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} aria-hidden="true" /> {featured.readingMinutes} min read
              </span>
            </div>
            <h2 className="font-display mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              <Link href={`/blog/${featured.slug}`} className="hover:text-primary">
                {featured.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{featured.description}</p>
            <Link
              href={`/blog/${featured.slug}`}
              className="focus-ring mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Read the guide <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </article>

      {/* Remaining posts */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {rest.map((post) => {
          const tool = getTool(post.relatedTools[0]);
          return (
            <article
              key={post.slug}
              className="card-lift flex flex-col rounded-2xl border bg-card p-5 shadow-card hover:border-primary/30 hover:shadow-card-hover"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <ToolIcon name={tool?.icon ?? "FileText"} size={19} />
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">{post.readingMinutes} min</span>
              </div>
              <h2 className="font-display mt-4 text-base font-semibold leading-snug text-foreground">
                <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
                {post.description}
              </p>
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
                <span className="font-medium text-primary">{post.category}</span>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              </div>
            </article>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border bg-gradient-to-r from-secondary/80 via-card to-secondary/50 px-6 py-10 text-center shadow-card">
        <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
          Prefer doing to reading?
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Every guide on this blog maps to a free tool. Jump straight in.
        </p>
        <Link
          href="/tools"
          className="focus-ring mt-1 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-mint transition-all hover:-translate-y-0.5 hover:bg-primary/90"
        >
          Explore all tools <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
