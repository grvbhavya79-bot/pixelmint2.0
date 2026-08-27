import type { Metadata } from "next";
import Link from "next/link";
import { Accessibility, Bolt, Globe, HeartHandshake, Lock, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { ALL_TOOLS, CATEGORIES } from "@/lib/tools/registry";
import { LogoMark } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "About Pixelmint.fun — Our Mission & Values",
  description:
    "Pixelmint.fun was built to make everyday digital work feel effortless. Learn about our mission, our values, and the maker behind 100+ free online tools.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Pixelmint.fun",
    description: "Useful tools should be fast, simple, accessible, and available to everyone. Meet the studio behind 100+ free online tools.",
    url: "/about",
    type: "website",
  },
};

const VALUES = [
  {
    icon: Sparkles,
    title: "Simplicity",
    text: "Every tool opens ready to use — no manuals, no configuration marathons. If a task takes more than three steps, we redesign the tool, not the instructions.",
  },
  {
    icon: Lock,
    title: "Privacy",
    text: "Your files are yours. Wherever technically possible, processing happens locally in your browser — documents never leave your device at all.",
  },
  {
    icon: Bolt,
    title: "Speed",
    text: "Local processing means instant results with no upload queues. The site is built lean so pages load fast even on slow connections.",
  },
  {
    icon: Accessibility,
    title: "Accessibility",
    text: "Keyboard navigation, screen-reader labels, high contrast and reduced-motion support are built in — the tools work for everyone.",
  },
  {
    icon: ShieldCheck,
    title: "Trustworthiness",
    text: "No dark patterns, no fake download buttons, no selling data. Every tool is tested end-to-end with real files before it ships.",
  },
  {
    icon: HeartHandshake,
    title: "Usefulness",
    text: "We build tools people actually need — the everyday tasks that eat your time — and we make each one genuinely excellent.",
  },
];

export default function AboutPage() {
  return (
    <div className="container-page max-w-4xl py-12">
      <header className="text-center">
        <LogoMark size={56} className="mx-auto" />
        <h1 className="font-display mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          About Pixelmint.fun
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Pixelmint.fun was built to make everyday digital work feel effortless. We believe
          useful tools should be fast, simple, accessible, and available to everyone — so we
          put {ALL_TOOLS.length}+ of them in one smart place.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-foreground sm:text-base">
          Every tool. One smart place.
        </p>
      </header>

      {/* Mission */}
      <section className="mt-12 rounded-2xl border bg-gradient-to-r from-secondary/80 via-card to-secondary/50 p-8 text-center shadow-card sm:p-10">
        <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">Our mission</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          To make practical online tools available in one trusted place — so you never have to
          hunt through a dozen ad-covered websites to merge a PDF, resize an image or format
          a JSON file ever again.
        </p>
      </section>

      {/* Values */}
      <section className="mt-12" aria-labelledby="values-heading">
        <h2 id="values-heading" className="font-display text-center text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          What we value
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="card-lift rounded-2xl border bg-card p-5 shadow-card hover:shadow-card-hover">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <value.icon size={19} aria-hidden="true" />
              </span>
              <h3 className="mt-3.5 text-sm font-semibold text-foreground">{value.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{value.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="mt-12 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">Our story</h2>
        <p>
          Pixelmint.fun was created by <span className="font-semibold text-foreground">Gaurav Bhavya</span> from Madhubani,
          Bihar, India. The idea came from a simple frustration: everyday digital tasks — merging a few PDFs, resizing
          an image, formatting some JSON — always meant hopping between a dozen different websites, each with its own
          ads, sign-up walls and upload queues.
        </p>
        <p>
          The platform you&apos;re using now is the answer: one workspace with {ALL_TOOLS.length}+ well-built tools that
          share the same clean interface, the same privacy standards and the same attention to detail. Wherever
          technically possible, processing happens right inside your browser, which keeps your files yours and makes
          the tools dramatically faster than upload-based alternatives.
        </p>
        <p>
          Behind the scenes, the site is built with a modern, thoroughly tested technology stack. Every tool listed in
          the catalog is fully implemented — you will never find a &ldquo;coming soon&rdquo; placeholder here.
        </p>
      </section>

      {/* Facts */}
      <section className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Globe size={15} className="text-primary" aria-hidden="true" /> The maker
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex gap-2"><dt className="text-muted-foreground">Owner:</dt><dd className="font-medium text-foreground">Gaurav Bhavya</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">Location:</dt><dd className="font-medium text-foreground">Madhubani, Bihar, India</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">Email:</dt><dd><a className="font-medium text-primary hover:underline" href="mailto:Grvbhavya79@gmail.com">Grvbhavya79@gmail.com</a></dd></div>
          </dl>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Zap size={15} className="text-primary" aria-hidden="true" /> What&apos;s inside
          </h2>
          <ul className="mt-3 space-y-1.5">
            {CATEGORIES.map((category) => (
              <li key={category.id} className="flex items-center justify-between text-sm">
                <Link href={`/categories/${category.slug}`} className="text-muted-foreground hover:text-primary">
                  {category.name}
                </Link>
                <span className="text-xs font-semibold text-foreground">
                  {ALL_TOOLS.filter((t) => t.category === category.id).length} tools
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mt-10 rounded-2xl border bg-gradient-to-r from-primary/10 via-secondary to-primary/10 p-8 text-center">
        <p className="text-lg font-semibold text-foreground">Say hello</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Questions, ideas or feedback — we&apos;d love to hear from you.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact"
            className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-mint hover:bg-primary/90"
          >
            Contact us
          </Link>
          <Link
            href="/tools"
            className="focus-ring inline-flex items-center gap-1.5 rounded-xl border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-card hover:shadow-card-hover"
          >
            Explore all tools
          </Link>
        </div>
      </div>
    </div>
  );
}
