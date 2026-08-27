"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  { value: "General question", placeholder: "General question" },
  { value: "Tool feedback", placeholder: "Tool feedback" },
  { value: "Bug report", placeholder: "Bug report" },
  { value: "Partnership", placeholder: "Partnership" },
  { value: "Privacy request", placeholder: "Privacy request" },
];

export function ContactForm() {
  const [form, setForm] = useState({
    name: "", email: "", subject: "", message: "", category: "", honeypot: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setFeedback(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }
      setStatus("sent");
      setFeedback(data.message ?? "Message sent — we'll reply soon.");
      setForm({ name: "", email: "", subject: "", message: "", category: "", honeypot: "" });
    } catch (err) {
      setStatus("error");
      setFeedback(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-8 text-center" role="status">
        <CheckCircle2 className="pm-check-pop mx-auto text-success" size={36} aria-hidden="true" />
        <h3 className="mt-3 text-lg font-semibold text-foreground">Message sent</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{feedback}</p>
        <Button variant="outline" className="mt-5" onClick={() => setStatus("idle")}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-5 shadow-card sm:p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cf-name">Name</Label>
          <Input id="cf-name" value={form.name} onChange={set("name")} required minLength={2} maxLength={80} placeholder="Your name" autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-email">Email</Label>
          <Input id="cf-email" type="email" value={form.email} onChange={set("email")} required maxLength={200} placeholder="you@gmail.com" autoComplete="email" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cf-category">Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
            <SelectTrigger id="cf-category" aria-label="Message category">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.placeholder}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-subject">Subject</Label>
          <Input id="cf-subject" value={form.subject} onChange={set("subject")} required minLength={3} maxLength={150} placeholder="What is this about?" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cf-message">Message</Label>
        <Textarea id="cf-message" value={form.message} onChange={set("message")} required minLength={10} maxLength={5000} placeholder="Tell us what you need — a bug report, a tool idea, feedback…" className="min-h-32" />
      </div>

      {/* spam trap — hidden from humans */}
      <input
        type="text"
        name="company_website"
        value={form.honeypot}
        onChange={set("honeypot")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />

      {status === "error" && feedback && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {feedback}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          Protected by rate limiting and spam checks. Your message is stored securely and emailed to the site owner.
        </p>
        <Button type="submit" disabled={status === "sending"} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
          {status === "sending" ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Send size={14} className="mr-1.5" />}
          Send Message
        </Button>
      </div>
    </form>
  );
}
