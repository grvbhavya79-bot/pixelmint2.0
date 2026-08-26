import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Globe, HeartHandshake, MapPin, ShieldCheck, Zap } from "lucide-react";
import { ALL_TOOLS, CATEGORIES } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "About ToolBox100 — 100 Free Online Tools",
  description:
    "ToolBox100 is an independent online utility platform by Grv Bhavya, designed to make common file, document, developer and calculation tasks easier.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="container-page max-w-4xl py-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">About ToolBox100</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          ToolBox100 is an independent online utility platform designed to make common file, document,
          developer and calculation tasks easier — {ALL_TOOLS.length} focused tools in one simple, fast workspace.
        </p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {[
          { icon: Zap, title: "Fast by architecture", text: "Most tools process files locally in your browser, so results are instant and nothing queues on a server." },
          { icon: ShieldCheck, title: "Private by default", text: "Your documents and images stay on your device for the tools that work locally — no uploads, no storage." },
          { icon: HeartHandshake, title: "Free and open to all", text: "No accounts, no watermarks, no paywalls. Every tool on the site is free to use as often as you need." },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border bg-card p-5 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <item.icon size={19} aria-hidden="true" />
            </span>
            <h2 className="mt-3.5 text-sm font-semibold text-foreground">{item.title}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>

      <section className="mt-12 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
        <h2 className="text-xl font-bold text-foreground">Our story</h2>
        <p>
          ToolBox100 was created by <span className="font-semibold text-foreground">Grv Bhavya</span> from Madhubani,
          Bihar, India. The idea came from a simple frustration: everyday digital tasks — merging a few PDFs, resizing
          an image, formatting some JSON — always meant hopping between a dozen different websites, each with its own
          ads, sign-up walls and upload queues.
        </p>
        <p>
          The platform you&apos;re using now is the answer: one workspace with {ALL_TOOLS.length} well-built tools that
          share the same clean interface, the same privacy standards and the same attention to detail. Wherever
          technically possible, processing happens right inside your browser, which keeps your files yours and makes
          the tools dramatically faster than upload-based alternatives.
        </p>
        <p>
          Behind the scenes, the site is built with a modern, thoroughly tested technology stack. Every tool listed in
          the catalog is fully implemented — you will never find a &ldquo;coming soon&rdquo; placeholder here.
        </p>
      </section>

      <section className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin size={15} className="text-primary" aria-hidden="true" /> The maker
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex gap-2"><dt className="text-muted-foreground">Owner:</dt><dd className="font-medium text-foreground">Grv Bhavya</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">Location:</dt><dd className="font-medium text-foreground">Madhubani, Bihar, India</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">Email:</dt><dd><a className="font-medium text-primary hover:underline" href="mailto:grvbhavya79@gmail.com">grvbhavya79@gmail.com</a></dd></div>
          </dl>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Globe size={15} className="text-primary" aria-hidden="true" /> What&apos;s inside
          </h2>
          <ul className="mt-3 space-y-1.5">
            {CATEGORIES.map((category) => (
              <li key={category.id} className="flex items-center justify-between text-sm">
                <Link href={`/categories/${category.slug}`} className="text-muted-foreground hover:text-primary">
                  {category.name}
                </Link>
                <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
                  <CheckCircle2 size={12} className="text-success" aria-hidden="true" />
                  {ALL_TOOLS.filter((t) => t.category === category.id).length} tools
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mt-10 rounded-2xl border bg-gradient-to-r from-primary/10 via-secondary to-primary/10 p-8 text-center">
        <p className="text-lg font-semibold text-foreground">Try the workspace</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {ALL_TOOLS.length} tools, one search box, zero friction.
        </p>
        <Link
          href="/tools"
          className="focus-ring mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90"
        >
          Explore all tools
        </Link>
      </div>
    </div>
  );
}
