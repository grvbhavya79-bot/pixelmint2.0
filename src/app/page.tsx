import Link from "next/link";
import {
  ArrowRight, CheckCircle2, Gauge, Lock, MousePointerClick, ShieldCheck,
  Smartphone, Sparkles, Star, Upload, WifiOff, Zap,
} from "lucide-react";
import { HeroSearch } from "@/components/layout/hero-search";
import { ToolBrowser } from "@/components/tools/tool-browser";
import { ToolCard } from "@/components/tools/tool-card";
import { ToolIcon } from "@/components/tools/tool-icon";
import { ALL_TOOLS, getTool } from "@/lib/tools/registry";
import { CATEGORIES, categoryCount } from "@/lib/tools/categories";
import { RecentToolsRow } from "@/components/layout/recent-tools-row";
import { LogoMark } from "@/components/layout/logo";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const HERO_SHORTCUTS = [
  { slug: "merge-pdf", label: "Merge PDF" },
  { slug: "compress-pdf", label: "Compress PDF" },
  { slug: "jpg-to-png", label: "JPG to PNG" },
  { slug: "image-compressor", label: "Image Compressor" },
  { slug: "pdf-to-word", label: "PDF to Word" },
  { slug: "word-to-pdf", label: "Word to PDF" },
  { slug: "background-remover", label: "Remove Background" },
  { slug: "qr-code-generator", label: "QR Code Generator" },
];

const FEATURED_SLUGS = [
  "merge-pdf", "split-pdf", "compress-pdf", "pdf-to-word", "word-to-pdf",
  "jpg-to-png", "png-to-jpg", "image-compressor", "image-resizer",
  "background-remover", "qr-code-generator", "password-generator", "json-formatter",
];

const WHY = [
  {
    icon: Zap,
    title: "Fast and easy to use",
    text: "Every tool opens ready to work — no sign-ups, no setup, no learning curve. One click and you're converting, editing or generating.",
  },
  {
    icon: CheckCircle2,
    title: "Free with transparent limits",
    text: "All tools are free, with generous fair-use limits instead of paywalls. What you see is what you get — no surprise upsells mid-task.",
  },
  {
    icon: Smartphone,
    title: "Works on any device",
    text: "Phone, tablet, laptop or desktop — the interface adapts to your screen, so you can fix a file from anywhere.",
  },
  {
    icon: Upload,
    title: "No software installation",
    text: "Everything runs in your browser. Nothing to download, nothing to update, nothing taking up space on your device.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-first file handling",
    text: "Most tools process files locally on your device — they never leave your browser. Server tools use secure, temporary handling.",
  },
  {
    icon: Gauge,
    title: "Clean results, every time",
    text: "Tools are tested end-to-end with real files, so downloads open correctly, math adds up and output looks professional.",
  },
];

const STEPS = [
  {
    title: "Choose a tool",
    text: "Search or browse categories — with 100+ tools, you are seconds away from the right one.",
  },
  {
    title: "Upload, paste or enter your content",
    text: "Drag files in, paste text, or type values. Everything works right in your browser.",
  },
  {
    title: "Download or copy your result",
    text: "Get your polished output in one click — download files or copy text instantly.",
  },
];

const FAQS = [
  {
    q: "Is Pixelmint.fun free to use?",
    a: "Yes — every tool on Pixelmint.fun is completely free. We use fair-use limits to keep things fast and available for everyone, but there are no paywalls, no watermarks and no hidden charges.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. There is no sign-up anywhere on the site. Open a tool, do your work, download your result — that's the whole flow. You can optionally mark favorites, which are stored privately in your own browser.",
  },
  {
    q: "Are my uploaded files secure?",
    a: "Yes. Most tools run entirely in your browser, which means your files never leave your device at all — merging, converting and editing happens locally. The few server-based tools use encrypted connections and temporary processing.",
  },
  {
    q: "Can I use Pixelmint.fun on mobile?",
    a: "Absolutely. The entire site is built mobile-first, so every tool works on phones and tablets with touch-friendly upload areas, large buttons and no horizontal scrolling.",
  },
  {
    q: "How many tools does Pixelmint.fun offer?",
    a: `Pixelmint.fun currently offers ${ALL_TOOLS.length} tools across PDF, image, file, text, developer, AI and calculator categories — and the collection keeps growing.`,
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default function HomePage() {
  const popular = ALL_TOOLS.filter((t) => t.popular);
  const featured = FEATURED_SLUGS.map((slug) => getTool(slug)).filter((t) => t !== undefined);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-secondary/70 via-background to-background">
        <div className="bg-grid absolute inset-0" aria-hidden="true" />
        <div className="bg-pixel-grid absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="absolute -top-28 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        {/* floating pixel accents */}
        <span className="pm-float-soft absolute left-[8%] top-[22%] hidden h-3 w-3 rounded-[3px] bg-primary/25 lg:block" aria-hidden="true" />
        <span className="pm-float-soft absolute right-[10%] top-[30%] hidden h-4 w-4 rounded-[4px] bg-mint/30 lg:block" style={{ animationDelay: "1.2s" }} aria-hidden="true" />
        <span className="pm-float-soft absolute bottom-[24%] left-[16%] hidden h-2.5 w-2.5 rounded-[3px] bg-primary/20 xl:block" style={{ animationDelay: "2.1s" }} aria-hidden="true" />

        <div className="container-page relative flex flex-col items-center py-14 text-center sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-card">
            <Sparkles size={13} className="text-primary" aria-hidden="true" />
            {ALL_TOOLS.length}+ free tools · no sign-up · privacy-friendly
          </span>
          <h1 className="font-display mt-5 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Every tool.{" "}
            <span className="text-gradient">One smart place.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Convert, edit, compress, create, and organize files with {ALL_TOOLS.length}+ fast, free online tools.
          </p>

          <div className="mt-8 w-full max-w-2xl">
            <HeroSearch />
          </div>

          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {HERO_SHORTCUTS.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/tools/${item.slug}`}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground hover:shadow-mint"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ Recently used ============ */}
      <RecentToolsRow />

      {/* ============ Categories ============ */}
      <section className="container-page py-12" aria-labelledby="categories-heading">
        <div className="flex items-end justify-between">
          <div>
            <h2 id="categories-heading" className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Browse by category</h2>
            <p className="mt-1 text-sm text-muted-foreground">{CATEGORIES.length} categories covering files, documents, code, AI and daily calculations.</p>
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
              className="focus-ring card-lift group rounded-2xl border bg-card p-5 shadow-card hover:border-primary/30 hover:shadow-card-hover"
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

      {/* ============ Featured / Popular ============ */}
      <section className="border-y bg-card/50 py-12" aria-labelledby="featured-heading">
        <div className="container-page">
          <div className="flex items-end justify-between">
            <div>
              <h2 id="featured-heading" className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                <Star className="text-amber-500" size={22} aria-hidden="true" /> Featured tools
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">The utilities people reach for most often.</p>
            </div>
            <Link href="/popular" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">
              See all <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ All tools browser ============ */}
      <section className="container-page py-12" aria-labelledby="all-heading">
        <h2 id="all-heading" className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">All {ALL_TOOLS.length} tools</h2>
        <p className="mt-1 text-sm text-muted-foreground">Search or filter to find exactly what you need.</p>
        <div className="mt-6">
          <ToolBrowser tools={ALL_TOOLS} />
        </div>
      </section>

      {/* ============ Why Pixelmint.fun ============ */}
      <section className="border-t bg-card/50 py-16" aria-labelledby="why-heading">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground">
              <Sparkles size={13} aria-hidden="true" /> Why Pixelmint.fun
            </span>
            <h2 id="why-heading" className="font-display mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Simple tools. Serious results.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Built for the things you actually need to get done — and nothing you don't.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map((item) => (
              <div key={item.title} className="card-lift rounded-2xl border bg-card p-5 shadow-card hover:shadow-card-hover sm:p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <item.icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ How it works ============ */}
      <section className="container-page py-16" aria-labelledby="how-heading">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="how-heading" className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Three steps, zero friction — from problem to finished file.
          </p>
        </div>
        <ol className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card-lift relative rounded-2xl border bg-card p-6 shadow-card hover:shadow-card-hover">
              <span className="font-display flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-mint">
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ============ FAQ ============ */}
      <section className="border-t bg-card/50 py-16" aria-labelledby="faq-heading">
        <div className="container-page max-w-3xl">
          <div className="text-center">
            <h2 id="faq-heading" className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Everything you might want to know before you start.
            </p>
          </div>
          <Accordion type="single" collapsible className="mt-8 rounded-2xl border bg-card px-5 shadow-card">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b last:border-b-0">
                <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline sm:text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ============ Final CTA ============ */}
      <section className="container-page py-16" aria-labelledby="cta-heading">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-secondary via-card to-secondary/50 px-6 py-14 text-center shadow-card sm:px-12">
          <div className="bg-pixel-grid absolute inset-0 opacity-50" aria-hidden="true" />
          <span className="pm-float-soft absolute left-[6%] top-[18%] hidden h-3 w-3 rounded-[3px] bg-primary/20 sm:block" aria-hidden="true" />
          <span className="pm-float-soft absolute bottom-[16%] right-[7%] hidden h-4 w-4 rounded-[4px] bg-mint/25 sm:block" style={{ animationDelay: "1.4s" }} aria-hidden="true" />
          <div className="relative">
            <LogoMark size={44} className="mx-auto" animate={false} />
            <h2 id="cta-heading" className="font-display mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your everyday toolkit is ready.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              From quick conversions to creative edits, get more done in less time.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/tools"
                className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-mint transition-all hover:-translate-y-0.5 hover:bg-primary/90"
              >
                <MousePointerClick size={16} aria-hidden="true" />
                Explore all tools
              </Link>
              <Link
                href="/categories"
                className="focus-ring inline-flex items-center gap-1.5 rounded-xl border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                Browse categories
              </Link>
            </div>
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Lock size={11} aria-hidden="true" /> Privacy-first</span>
              <span className="inline-flex items-center gap-1"><WifiOff size={11} aria-hidden="true" /> No install</span>
              <span className="inline-flex items-center gap-1"><Zap size={11} aria-hidden="true" /> Instant results</span>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
