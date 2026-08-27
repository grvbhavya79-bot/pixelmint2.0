import Link from "next/link";
import {
  ArrowRight, Gauge, Lock, MousePointerClick, ShieldCheck, Sparkles, Star, WifiOff, Zap,
} from "lucide-react";
import { HeroSearch } from "@/components/layout/hero-search";
import { ToolBrowser } from "@/components/tools/tool-browser";
import { ToolCard } from "@/components/tools/tool-card";
import { ToolIcon } from "@/components/tools/tool-icon";
import { ALL_TOOLS, getPopularTools } from "@/lib/tools/registry";
import { CATEGORIES, categoryCount } from "@/lib/tools/categories";
import { RecentToolsRow } from "@/components/layout/recent-tools-row";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Private by design",
    text: "Most tools run 100% in your browser — your files never leave your device.",
  },
  {
    icon: Zap,
    title: "Instantly fast",
    text: "No uploads means no waiting. Local processing starts the moment you click.",
  },
  {
    icon: Lock,
    title: "No account needed",
    text: "Every tool is free with no sign-up, no watermarks and no daily limits.",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    text: "Once loaded, client-side tools keep working without an internet connection.",
  },
];

export default function HomePage() {
  const popular = getPopularTools();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-secondary/60 via-background to-background">
        <div className="bg-grid absolute inset-0" aria-hidden="true" />
        <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="container-page relative flex flex-col items-center py-16 text-center sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-card">
            <Sparkles size={13} className="text-primary" aria-hidden="true" />
            {ALL_TOOLS.length} free tools · no sign-up · privacy-friendly
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            100 Powerful Tools.
            <br />
            <span className="text-gradient">One Simple Workspace.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Convert, compress, edit, generate, calculate and manage your files with simple online tools.
          </p>

          <div className="mt-8 w-full">
            <HeroSearch />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/tools"
              className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-all hover:bg-primary/90 hover:shadow-card-hover"
            >
              Explore Tools <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link
              href="/popular"
              className="focus-ring inline-flex items-center gap-1.5 rounded-xl border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-card transition-all hover:shadow-card-hover"
            >
              <Star size={15} className="text-amber-500" aria-hidden="true" /> Popular Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Recently used (localStorage, client-only) */}
      <RecentToolsRow />

      {/* Categories */}
      <section className="container-page py-12" aria-labelledby="categories-heading">
        <div className="flex items-end justify-between">
          <div>
            <h2 id="categories-heading" className="text-2xl font-bold tracking-tight text-foreground">Browse by category</h2>
            <p className="mt-1 text-sm text-muted-foreground">Seven categories covering files, documents, code and daily calculations.</p>
          </div>
          <Link href="/categories" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">
            All categories <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="focus-ring group rounded-2xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", category.gradient)}>
                <ToolIcon name={category.icon} size={20} />
              </span>
              <h3 className="mt-3.5 text-sm font-semibold text-foreground group-hover:text-primary">{category.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{category.description}</p>
              <p className="mt-2.5 text-xs font-semibold text-primary">{categoryCount(category.id, ALL_TOOLS)} tools →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular */}
      <section className="border-y bg-card/50 py-12" aria-labelledby="popular-heading">
        <div className="container-page">
          <div className="flex items-end justify-between">
            <div>
              <h2 id="popular-heading" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                <Star className="text-amber-500" size={22} aria-hidden="true" /> Popular tools
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">The utilities people reach for most often.</p>
            </div>
            <Link href="/popular" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">
              See all <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {popular.slice(0, 12).map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* All tools browser */}
      <section className="container-page py-12" aria-labelledby="all-heading">
        <h2 id="all-heading" className="text-2xl font-bold tracking-tight text-foreground">All {ALL_TOOLS.length} tools</h2>
        <p className="mt-1 text-sm text-muted-foreground">Search or filter to find exactly what you need.</p>
        <div className="mt-6">
          <ToolBrowser tools={ALL_TOOLS} />
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-card/50 py-14" aria-labelledby="why-heading">
        <div className="container-page">
          <h2 id="why-heading" className="text-center text-2xl font-bold tracking-tight text-foreground">
            Why ToolBox100 is different
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-2xl border bg-card p-5 shadow-card">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <feature.icon size={19} aria-hidden="true" />
                </span>
                <h3 className="mt-3.5 text-sm font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{feature.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border bg-gradient-to-r from-primary/10 via-secondary to-primary/10 p-8 text-center">
            <p className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Gauge className="text-primary" size={20} aria-hidden="true" />
              Ready when you are
            </p>
            <p className="max-w-lg text-sm text-muted-foreground">
              Pick any tool and start working in one click — {ALL_TOOLS.length} utilities, zero setup.
            </p>
            <Link
              href="/tools"
              className="focus-ring mt-1 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90"
            >
              <MousePointerClick size={15} aria-hidden="true" /> Open a tool
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
