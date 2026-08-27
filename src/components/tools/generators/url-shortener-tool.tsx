"use client";

import { useState } from "react";
import { Copy, ExternalLink, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copyText } from "@/lib/download";
import { pushRecent } from "@/hooks/use-local-tools";

interface CreatedLink {
  shortUrl: string;
  destination: string;
  expiresAt: string | null;
  clicks: number;
}

export default function UrlShortenerTool() {
  const [url, setUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [expiryDays, setExpiryDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedLink | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setLoading(true);
    setError(null);
    setCreated(null);
    pushRecent("url-shortener");
    try {
      const body: Record<string, unknown> = { url: url.trim() };
      if (customCode.trim()) body.customCode = customCode.trim();
      if (expiryDays.trim()) body.expiresInDays = parseInt(expiryDays, 10);
      const res = await fetch("/api/shortener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "The link could not be created. Please try again.");
      }
      setCreated(data.link);
      toast.success("Short link created");
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "url-shortener" }),
        keepalive: true,
      }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
        <div className="space-y-1.5">
          <Label htmlFor="short-url" className="text-[13px] font-medium">Destination URL</Label>
          <Input
            id="short-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/a/very/long/link?with=parameters"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="short-code" className="text-[13px] font-medium">Custom code (optional)</Label>
            <Input id="short-code" value={customCode} onChange={(e) => setCustomCode(e.target.value)} placeholder="my-link" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="short-expiry" className="text-[13px] font-medium">Expires after (optional)</Label>
            <Input id="short-expiry" type="number" min={1} max={3650} value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} placeholder="e.g. 30 days" />
          </div>
        </div>
        <Button onClick={() => void create()} disabled={loading || !url.trim()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
          {loading ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <Link2 size={15} className="mr-1.5" />}
          Create Short Link
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {created && (
        <div className="rounded-2xl border border-success/30 bg-success/5 p-5" role="status">
          <p className="text-sm font-semibold text-foreground">Your short link is ready</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <a
              href={created.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-card px-4 py-2.5 font-mono text-sm font-semibold text-primary shadow-card hover:underline"
            >
              {created.shortUrl}
              <ExternalLink size={13} />
            </a>
            <Button variant="outline" size="sm" onClick={() => void copyText(created.shortUrl).then(() => toast.success("Short link copied"))}>
              <Copy size={13} className="mr-1" /> Copy
            </Button>
          </div>
          <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
            <div className="flex gap-2">
              <dt>Destination:</dt>
              <dd className="truncate text-foreground">{created.destination}</dd>
            </div>
            {created.expiresAt && (
              <div className="flex gap-2">
                <dt>Expires:</dt>
                <dd className="text-foreground">{new Date(created.expiresAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}</dd>
              </div>
            )}
            <p>Clicks are counted automatically. Links can be managed from the admin dashboard.</p>
          </dl>
        </div>
      )}

      <div className="rounded-xl border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">About this shortener</p>
        <p className="mt-1">
          Links redirect with a 302 through <code className="rounded bg-muted px-1">/s/&lt;code&gt;</code>. Malicious destinations,
          private network addresses and non-HTTP protocols are rejected, and creation is rate-limited to prevent abuse.
        </p>
      </div>
    </div>
  );
}
