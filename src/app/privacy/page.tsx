import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — ToolBox100",
  description:
    "How ToolBox100 handles your data: local file processing, anonymous usage analytics, cookies, third-party APIs and your rights — explained honestly.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "Overview",
    paragraphs: [
      "This policy explains, honestly and in plain language, what information ToolBox100 collects and how it is handled. The short version: most of what you do on this site never reaches our servers at all, because the majority of our tools process files locally inside your own browser.",
    ],
  },
  {
    title: "File processing",
    paragraphs: [
      "Tools marked with the “Private processing” badge — including the PDF, image, document, archive and developer tools — run entirely in your browser using client-side technology. Your files are not uploaded to, transmitted to, or stored on any server. When you close or refresh the page, the processed data is gone.",
      "A small number of features do involve our servers: the URL shortener (it must store the link mapping), the currency converter (it fetches live exchange rates), the contact form (it stores and emails your message), and anonymous usage analytics. These features only send the minimum data needed to work.",
      "We never store uploaded files permanently, because for locally-processed tools there is nothing to store, and no file-upload endpoint exists for them in the first place.",
    ],
  },
  {
    title: "Information we collect",
    paragraphs: [
      "Anonymous usage events: when a tool finishes successfully or fails, the tool identifier and outcome are recorded (for example “merge-pdf: success”). These events contain no personal data, no file contents and no identifiers that can single you out across sessions.",
      "Contact form submissions: if you contact us, we store the name, email address, subject and message you provide, so we can reply.",
      "Short link records: creating a short link stores the destination URL, a click counter, and optionally an expiry date. We do not build individual visitor profiles from clicks.",
      "Favorites and recently-used tools are stored only in your browser's local storage and never transmitted to us.",
    ],
  },
  {
    title: "Cookies",
    paragraphs: [
      "ToolBox100 sets no advertising or tracking cookies. The site uses local storage for your theme preference (light/dark/system) and your favorites/recents, and a signed, httpOnly session cookie only if you sign in to the admin dashboard.",
    ],
  },
  {
    title: "Third-party services",
    paragraphs: [
      "The currency converter fetches exchange rates from public financial-data APIs (frankfurter.dev and open.er-api.com). These requests are made server-side, so your IP address is not shared with them by your browser.",
      "The PDF OCR tool downloads its recognition language model at runtime from a public CDN (unpkg) directly to your browser. If you use that tool, the CDN will see the request for the model file; no document content is ever sent there — recognition happens locally.",
      "If email delivery is configured, contact-form messages are delivered through the Resend email API. No other third parties receive your data.",
    ],
  },
  {
    title: "Analytics",
    paragraphs: [
      "We use simple, self-hosted aggregate analytics (tool usage counts) rather than third-party trackers. We do not run Google Analytics or any cross-site tracking scripts, and we do not sell or share usage data.",
    ],
  },
  {
    title: "Security",
    paragraphs: [
      "Server-side features use rate limiting, input validation and content-based file checks. Admin access is password-protected with signed sessions. We never execute uploaded content, and client-side processing means sensitive documents never leave your device in the first place.",
      "No system is perfect. If you believe you have found a security issue, please contact us at grvbhavya79@gmail.com and we will investigate promptly.",
    ],
  },
  {
    title: "Your rights",
    paragraphs: [
      "You can clear everything this site stores about you at any time by clearing your browser's local storage for this domain. To request deletion of a contact-form message or short link you created, email grvbhavya79@gmail.com and we will remove it.",
      "Because our analytics are anonymous and aggregate, we cannot associate past usage events with you individually.",
    ],
  },
  {
    title: "Changes to this policy",
    paragraphs: [
      "If this policy changes materially, the updated date below will change and significant changes will be summarized at the top of this page.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "Questions about privacy? Email grvbhavya79@gmail.com or use the contact form. Owner: Grv Bhavya, Madhubani, Bihar, India — 847226.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 1 January 2026</p>
      </header>
      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title} aria-labelledby={`privacy-${section.title.replace(/\s+/g, "-")}`}>
            <h2 id={`privacy-${section.title.replace(/\s+/g, "-")}`} className="text-lg font-bold text-foreground">
              {section.title}
            </h2>
            <div className="mt-2 space-y-3">
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
