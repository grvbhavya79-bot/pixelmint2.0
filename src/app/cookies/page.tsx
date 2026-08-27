import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — What We Store and Why",
  description:
    "Pixelmint.fun uses almost no cookies: one anonymous analytics cookie and local browser storage for your favorites. Read the full cookie policy.",
  alternates: { canonical: "/cookies" },
};

const SECTIONS = [
  {
    title: "The short version",
    body: [
      "Pixelmint.fun is deliberately light on cookies. We do not run advertising networks, we do not sell data, and we do not track you across other websites. In total, the site sets one anonymous analytics cookie and uses your browser's local storage to remember your preferences.",
    ],
  },
  {
    title: "What we use",
    body: [
      "Anonymous analytics: when you use a tool, a single request records that the tool was used — with no identifying information attached. This tells us which tools are genuinely useful and helps us decide what to build next. It cannot tell us who you are.",
      "Local storage: your favorite tools and recently used tools are saved in your own browser's local storage. This data never leaves your device and is not transmitted to our servers.",
      "Theme preference: your light/dark mode choice is remembered locally so the site looks the way you left it.",
    ],
  },
  {
    title: "What we never do",
    body: [
      "We do not use advertising or cross-site tracking cookies. We do not fingerprint your device. We do not share analytics data with third-party marketers. And because most tools process your files locally in your browser, your documents themselves never touch our servers at all.",
    ],
  },
  {
    title: "Managing cookies",
    body: [
      "You can clear local storage and cookies at any time through your browser settings — look for 'Clear browsing data' and include 'Cookies and other site data'. Doing this will reset your favorites and theme preference, but every tool will keep working exactly as before.",
      "Questions about this policy? Contact us at hello@pixelmint.fun and we will answer plainly.",
    ],
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Cookie Policy</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          How Pixelmint.fun uses cookies and local storage — which is as little as possible.
        </p>
      </header>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title} aria-labelledby={section.title.replace(/\s+/g, "-").toLowerCase()}>
            <h2 id={section.title.replace(/\s+/g, "-").toLowerCase()} className="font-display text-xl font-bold tracking-tight text-foreground">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3">
              {section.body.map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{para}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 border-t pt-6 text-xs text-muted-foreground">
        Last updated: February 2026 · © 2026 Pixelmint.fun
      </p>
    </div>
  );
}
