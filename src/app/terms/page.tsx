import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Pixelmint.fun",
  description:
    "The terms for using Pixelmint.fun: acceptable use, your responsibilities, file processing, third-party services, availability and liability.",
  alternates: { canonical: "/terms" },
};

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "1. Acceptance of terms",
    paragraphs: [
      "By accessing or using Pixelmint.fun (the “service”), you agree to these terms. If you do not agree, please do not use the service. The service is owned and operated by Gaurav Bhavya (“we”, “us”), Madhubani, Bihar, India.",
    ],
  },
  {
    title: "2. Acceptable use",
    paragraphs: [
      "You may use the service for lawful purposes only. You must not: attempt to break, overload or reverse-engineer the service or its infrastructure; use the URL shortener to distribute malware, phishing pages or illegal content; process content you have no legal right to process; or use the service to infringe the rights of any person.",
      "We may rate-limit, block or disable access for behavior that threatens the service or other users, without notice where reasonably necessary.",
    ],
  },
  {
    title: "3. Your responsibilities and files",
    paragraphs: [
      "You are responsible for the content you process. Most tools run entirely in your browser, which means you remain in full possession of your files at all times — but also that results depend on your device and browser capabilities.",
      "Keep backups. Before relying on any converted, compressed, merged or otherwise processed file, verify that the output meets your needs. We provide these tools “as is” without warranty of fitness for a particular purpose.",
      "For password-protected documents, you confirm you are authorized to apply or remove protection. The unlock tool works only when you supply the correct password for a document you own or are entitled to modify.",
    ],
  },
  {
    title: "4. File processing and retention",
    paragraphs: [
      "Locally-processed tools never transmit your files to us. Where server-side features are used (URL shortener, currency rates, contact form), only the minimum data described in the privacy policy is handled.",
      "We do not permanently store user files, and we do not inspect, moderate or claim any ownership over content you process with the tools. You retain all rights to your content.",
    ],
  },
  {
    title: "5. Third-party services",
    paragraphs: [
      "Some features rely on third-party components, such as public exchange-rate APIs and CDN-hosted OCR language models. We select reliable providers but cannot guarantee their continuous availability, and their own terms may apply to the small data interactions described in our privacy policy.",
    ],
  },
  {
    title: "6. Availability and changes",
    paragraphs: [
      "We aim for high availability but do not guarantee uninterrupted service. Tools, features and these terms may be updated over time; material changes to the terms will be reflected in the “last updated” date on this page. Continued use after changes means you accept the updated terms.",
    ],
  },
  {
    title: "7. Limitation of liability",
    paragraphs: [
      "To the maximum extent permitted by law, Pixelmint.fun and its owner shall not be liable for any indirect, incidental, special or consequential damages, or for any data loss arising from use of the service. Your exclusive remedy for dissatisfaction with the service is to stop using it.",
    ],
  },
  {
    title: "8. Abuse prevention",
    paragraphs: [
      "The service includes automated protections (rate limiting, URL safety checks, spam filtering). Attempts to circumvent these protections are violations of these terms.",
    ],
  },
  {
    title: "9. Contact",
    paragraphs: [
      "Questions about these terms? Contact Gaurav Bhavya at grvbhavya79@gmail.com, or write to Madhubani, Bihar, India — 847226.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 1 January 2026</p>
      </header>
      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
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
