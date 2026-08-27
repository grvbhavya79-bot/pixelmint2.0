import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageSquareHeart,
  Share2,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { UpiCopyButton } from "@/components/upi-copy-button";

const UPI_ID = "grvbhavya55@axl";

export const metadata: Metadata = {
  title: "Support Pixelmint.fun — Buy Us a Chai, Keep 100+ Tools Free",
  description:
    "Pixelmint.fun stays free and ad-light thanks to supporters. Scan the UPI QR or copy the ID to chip in — or support us for free by sharing and sending feedback.",
  alternates: { canonical: "/support" },
  openGraph: {
    title: "Support Pixelmint.fun",
    description:
      "Scan the UPI QR or copy the ID to support 100+ free tools — or help for free by sharing.",
    url: "/support",
    type: "website",
  },
};

const FREE_WAYS = [
  {
    icon: Share2,
    title: "Share the tools",
    text: "Send a Pixelmint link to a friend, classmate or colleague stuck doing manual file work. One share helps someone discover all 100+ tools.",
  },
  {
    icon: Star,
    title: "Favorite what you use",
    text: "Tap the star on tools you love. Favorites save to your browser and make your daily workflow faster — no account needed.",
  },
  {
    icon: MessageSquareHeart,
    title: "Tell us what to build next",
    text: "Use the contact form to request a tool or report anything broken. Most improvements on this site started as a user message.",
  },
];

export default function SupportPage() {
  return (
    <div className="container-page max-w-4xl py-12">
      <header className="text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-primary shadow-card">
          <Heart size={12} aria-hidden="true" /> Support Pixelmint
        </p>
        <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Keep 100+ tools free for everyone
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Pixelmint runs lean — no venture money, no data selling, no invasive ads.
          If a tool saved you time today, a small tip keeps the lights on and the tools free.
        </p>
      </header>

      {/* ============ UPI card ============ */}
      <section className="mt-10 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center" aria-label="Support via UPI">
        <div className="mx-auto flex w-full max-w-[280px] flex-col items-center rounded-2xl border bg-card p-6 shadow-card">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <Image
              src="/images/upi-qr.png"
              alt="UPI QR code for Pixelmint.fun — scan with any UPI app to pay grvbhavya55@axl"
              width={224}
              height={224}
              className="h-56 w-56"
              priority
            />
          </div>
          <p className="mt-4 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Scan with GPay · PhonePe · Paytm · BHIM
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Wallet size={15} className="text-primary" aria-hidden="true" />
            Pay via UPI
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Point your camera or any UPI app at the QR code — it opens a payment to
            Pixelmint instantly. Prefer typing? Copy the ID below and paste it in your app.
          </p>
          <div className="mt-4 rounded-xl border bg-muted/40 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              UPI ID
            </p>
            <p className="mt-0.5 font-mono text-base font-semibold break-all text-foreground">
              {UPI_ID}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <UpiCopyButton value={UPI_ID} />
            <a
              href={`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent("Pixelmint")}&cu=INR`}
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-mint transition-all hover:-translate-y-0.5 hover:bg-primary/90"
            >
              <Sparkles size={15} aria-hidden="true" />
              Open in UPI app
            </a>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Every contribution — the price of a chai or a full meal — goes directly toward
            hosting, domains and building new tools.
          </p>
        </div>
      </section>

      {/* ============ Free ways to support ============ */}
      <section className="mt-12" aria-label="Free ways to support">
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
          Not in a position to tip? Help for free
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Money is only one kind of support. These three take under a minute and help Pixelmint
          just as much.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {FREE_WAYS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card-lift rounded-2xl border bg-card p-5 shadow-card">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ Where it goes ============ */}
      <section className="mt-10 rounded-2xl border border-primary/25 bg-primary/5 p-6" aria-label="Where your support goes">
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          Where your support goes
        </h2>
        <ul className="mt-3 grid gap-2.5 text-sm text-muted-foreground sm:grid-cols-2">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            Servers and bandwidth that serve all 100+ tools at high speed
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            Domains, SSL certificates and the small software licences behind AI tools
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            Development time for new tools and improvements you request
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            Staying independent — no paywalls, no data selling, ever
          </li>
        </ul>
      </section>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Questions about supporting Pixelmint?{" "}
        <Link href="/contact" className="font-medium text-primary hover:underline">
          Get in touch
        </Link>{" "}
        — thank you for being here. 💚
      </p>
    </div>
  );
}
