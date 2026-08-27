import type { Metadata } from "next";
import { Clock3, Cookie, ExternalLink, Mail, MapPin, ShieldCheck } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

const SUPPORT_EMAIL = "Grvbhavya79@gmail.com";

export const metadata: Metadata = {
  title: "Contact Pixelmint.fun — Support, Feedback & Bug Reports",
  description:
    "Get in touch with the Pixelmint.fun team. Send feedback, report a bug, request a new tool or ask a question — we read every message.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Pixelmint.fun",
    description: "Send feedback, report a bug or request a new tool — we read every message.",
    url: "/contact",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="container-page max-w-4xl py-12">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Contact Us</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Found a bug, have a tool idea, or just want to say hello? Send a message — every one is read.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <ContactForm />

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Direct contact</h2>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Mail size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">Support email</p>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="break-all text-primary hover:underline">{SUPPORT_EMAIL}</a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">Madhubani, Bihar, India — 847226</p>
                  <p className="text-xs text-muted-foreground">Support hours: Mon–Sat</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock3 size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">Typical reply time</p>
                  <p className="text-xs text-muted-foreground">Within 1–2 business days</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck size={15} className="text-success" aria-hidden="true" /> Privacy note
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              The form sends your name, email and message to the site owner and stores them securely for follow-up.
              Nothing else is collected, and we never share your details with third parties. See the{" "}
              <a href="/privacy" className="text-primary hover:underline">privacy policy</a> for the full picture.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Cookie size={15} className="text-primary" aria-hidden="true" /> Cookies
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              We use only a tiny, anonymous analytics cookie and your local browser storage for favorites —
              no advertising trackers. Details in the{" "}
              <a href="/cookies" className="text-primary hover:underline">cookie policy</a>.
            </p>
          </div>
        </aside>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-card" aria-label="Our location on the map">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin size={15} className="text-primary" aria-hidden="true" />
            Where to find us
          </h2>
          <a
            href="https://maps.google.com/?q=Madhubani%2C+Bihar+847226%2C+India"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg text-xs font-medium text-primary hover:underline"
          >
            Open in Google Maps
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
        <iframe
          src="https://maps.google.com/maps?q=Madhubani%2C%20Bihar%20847226%2C%20India&z=13&output=embed"
          title="Map showing the Pixelmint.fun location in Madhubani, Bihar, India"
          width="100%"
          height="340"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="block h-[340px] w-full border-0"
        />
      </section>
    </div>
  );
}
