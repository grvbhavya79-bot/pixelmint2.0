import type { Metadata } from "next";
import { Clock3, Mail, MapPin, ShieldCheck } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact ToolBox100 — Support & Feedback",
  description:
    "Get in touch with the ToolBox100 team. Send feedback, report a bug or request a new tool — we read every message.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="container-page max-w-4xl py-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Contact Us</h1>
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
                <div>
                  <p className="font-medium text-foreground">Grv Bhavya</p>
                  <a href="mailto:grvbhavya79@gmail.com" className="text-primary hover:underline">grvbhavya79@gmail.com</a>
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
        </aside>
      </div>
    </div>
  );
}
