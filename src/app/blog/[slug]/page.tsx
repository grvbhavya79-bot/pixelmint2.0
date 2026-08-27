import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, ChevronRight, Clock, Sparkles } from "lucide-react";
import { POSTS, getPost, getRelatedPosts } from "@/lib/blog/posts";
import { getTool } from "@/lib/tools/registry";
import { ToolCard } from "@/components/tools/tool-card";
import { ToolIcon } from "@/components/tools/tool-icon";
import type { BlogBlock } from "@/lib/blog/posts";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

function RenderBlock({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 className="font-display mt-8 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {block.text}
        </h2>
      );
    case "p":
      return (
        <p className="mt-4 text-[15px] leading-7 text-muted-foreground">{block.text}</p>
      );
    case "list":
      return (
        <ul className="mt-4 space-y-2.5">
          {block.items.map((item) => (
            <li key={item.slice(0, 40)} className="flex items-start gap-2.5 text-[15px] leading-7 text-muted-foreground">
              <span className="mt-[13px] h-1.5 w-1.5 shrink-0 rounded-[2px] bg-primary" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <aside className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-secondary/60 px-5 py-4">
          <p className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
            <Sparkles size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            {block.text}
          </p>
          {block.toolSlug && block.toolName && (
            <Link
              href={`/tools/${block.toolSlug}`}
              className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-mint transition-all hover:-translate-y-0.5 hover:bg-primary/90"
            >
              Open {block.toolName} <ArrowRight size={12} aria-hidden="true" />
            </Link>
          )}
        </aside>
      );
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const relatedPosts = getRelatedPosts(post.slug, 2);
  const relatedTools = post.relatedTools
    .map((s) => getTool(s))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Pixelmint.fun", url: siteUrl },
    publisher: {
      "@type": "Organization",
      name: "Pixelmint.fun",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/icons/icon-512.png` },
    },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
  };

  const dateFormatted = new Date(`${post.date}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-primary">Home</Link></li>
          <li aria-hidden="true"><ChevronRight size={12} /></li>
          <li><Link href="/blog" className="hover:text-primary">Blog</Link></li>
          <li aria-hidden="true"><ChevronRight size={12} /></li>
          <li aria-current="page" className="font-medium text-foreground">{post.category}</li>
        </ol>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">
            {post.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={12} aria-hidden="true" />
            <time dateTime={post.date}>{dateFormatted}</time>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} aria-hidden="true" /> {post.readingMinutes} min read
          </span>
        </div>
        <h1 className="font-display mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{post.description}</p>
      </header>

      <article className="mt-6">
        {post.content.map((block, i) => (
          <RenderBlock key={i} block={block} />
        ))}
      </article>

      {/* Tools used in this article */}
      {relatedTools.length > 0 && (
        <section className="mt-12" aria-labelledby="article-tools-heading">
          <h2 id="article-tools-heading" className="font-display text-xl font-bold tracking-tight text-foreground">
            Tools in this guide
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Related articles */}
      {relatedPosts.length > 0 && (
        <section className="mt-12" aria-labelledby="related-posts-heading">
          <h2 id="related-posts-heading" className="font-display text-xl font-bold tracking-tight text-foreground">
            Keep reading
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {relatedPosts.map((rp) => (
              <Link
                key={rp.slug}
                href={`/blog/${rp.slug}`}
                className="focus-ring card-lift group flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-card hover:border-primary/30 hover:shadow-card-hover"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <ToolIcon name={getTool(rp.relatedTools[0])?.icon ?? "FileText"} size={19} />
                </span>
                <span>
                  <span className="block font-semibold leading-snug text-foreground group-hover:text-primary">
                    {rp.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {rp.readingMinutes} min read · {rp.category}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
