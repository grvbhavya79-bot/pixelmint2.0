"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, BarChart3, CheckCheck, Copy, Database, ExternalLink, Eye, EyeOff, Gauge,
  Loader2, Lock, LogOut, Mail, MailOpen, MessageSquare, Plus, RefreshCw, Search,
  Server, Trash2, TrendingUp, Download, Zap, AlertTriangle, CheckCircle2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTool } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

/* -------------------------------- Charts --------------------------------- */

function MiniBar({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-36 items-end gap-1" role="img" aria-label="Bar chart">
      {data.map((d, i) => (
        <div key={i} className="group relative flex-1">
          <div
            className={cn("w-full rounded-t transition-all", d.value > 0 ? "bg-primary/80 group-hover:bg-primary" : "bg-muted")}
            style={{ height: `${Math.max(3, (d.value / max) * 130)}px` }}
          />
          <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background group-hover:block">
            {d.label}: {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function HBar({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2.5" role="img" aria-label="Horizontal bar chart">
      {data.map((d) => (
        <li key={d.label}>
          <div className="flex justify-between text-xs">
            <span className="font-medium text-foreground">{d.label}</span>
            <span className="text-muted-foreground">{d.value.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Time helpers ------------------------------ */

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/* ------------------------------- Types ------------------------------------ */

interface Stats {
  totalUses: number;
  dailyUses: number;
  weeklyUses: number;
  monthlyUses: number;
  failedUses: number;
  successRate: number | null;
  uniqueToolsUsed: number;
  totalShortUrls: number;
  totalShortUrlClicks: number;
  totalMessages: number;
  unreadMessages: number;
  popularTools: { slug: string; count: number }[];
  dailyTraffic: { date: string; count: number }[];
  categoryTraffic: { category: string; count: number }[];
}

interface Overview {
  server: {
    runtime: string;
    uptime: string;
    memoryUsedMb: number | null;
    heapUsedMb: number | null;
    nodeEnv: string;
    dbSizeBytes: number | null;
  };
  config: {
    adminPasswordSet: boolean;
    adminSecretSet: boolean;
    siteUrlSet: boolean;
    emailConfigured: boolean;
  };
  recentActivity: { slug: string; toolName: string; status: string; at: string }[];
  recentErrors: { slug: string; toolName: string; at: string }[];
}

interface ShortUrlRow {
  id: string;
  shortCode: string;
  destinationUrl: string;
  clickCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface MessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/* ------------------------------- Dashboard -------------------------------- */

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [urls, setUrls] = useState<ShortUrlRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [urlSearch, setUrlSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [messageFilter, setMessageFilter] = useState<"all" | "unread">("all");
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const loadAllRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    const [statsRes, overviewRes, urlsRes, messagesRes] = await Promise.all([
      fetch("/api/admin/analytics"),
      fetch("/api/admin/overview"),
      fetch(`/api/admin/urls${urlSearch ? `?q=${encodeURIComponent(urlSearch)}` : ""}`),
      fetch("/api/admin/messages"),
    ]);
    if (statsRes.status === 401) {
      setAuthed(false);
      setRefreshing(false);
      return;
    }
    const statsJson = await statsRes.json();
    const overviewJson = await overviewRes.json();
    const urlsJson = await urlsRes.json();
    const messagesJson = await messagesRes.json();
    if (statsJson.success) setStats(statsJson.stats);
    if (overviewJson.success) setOverview(overviewJson.overview);
    if (urlsJson.success) setUrls(urlsJson.urls);
    if (messagesJson.success) setMessages(messagesJson.messages);
    setLastUpdated(new Date());
    setAuthed((a) => (a === false ? false : true));
    setRefreshing(false);
  }, [urlSearch]);

  // Keep a stable ref for the auto-refresh interval.
  useEffect(() => {
    loadAllRef.current = loadAll;
  }, [loadAll]);

  const firstLoad = useRef(true);
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      void loadAll();
    }
  }, [loadAll]);

  // Auto-refresh every 30s when enabled.
  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => void loadAllRef.current?.(), 30_000);
    return () => window.clearInterval(id);
  }, [autoRefresh]);

  const login = async () => {
    setBusy(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Login failed");
      setAuthed(true);
      setPassword("");
      await loadAll();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
    setStats(null);
    setOverview(null);
    router.refresh();
  };

  /* ------------------------------ URL actions ----------------------------- */

  const [newUrl, setNewUrl] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const createLink = async () => {
    setCreating(true);
    setCreateError(null);
    setCreatedLink(null);
    try {
      const res = await fetch("/api/admin/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl,
          customCode: newCode.trim() || undefined,
          expiresInDays: newExpiry ? Number(newExpiry) : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to create link");
      setCreatedLink(json.link.shortUrl);
      setNewUrl("");
      setNewCode("");
      setNewExpiry("");
      await loadAll();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create link");
    } finally {
      setCreating(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied`);
    } catch {
      showToast("Copy failed — select the text manually");
    }
  };

  const toggleUrl = async (id: string, isActive: boolean) => {
    await fetch("/api/admin/urls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    await loadAll();
  };

  const deleteUrl = async (id: string) => {
    await fetch("/api/admin/urls", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadAll();
  };

  /* ---------------------------- Message actions --------------------------- */

  const markRead = async (id: string, isRead: boolean) => {
    await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isRead }),
    });
    await loadAll();
  };

  const markAllRead = async () => {
    await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    showToast("All messages marked as read");
    await loadAll();
  };

  const deleteMessage = async (id: string) => {
    await fetch("/api/admin/messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadAll();
  };

  /* -------------------------------- Sign-in ------------------------------- */

  if (authed === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={26} />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
            <Lock size={22} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-foreground">Admin sign-in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter the administrator password to open the dashboard.</p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void login();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="admin-pw">Password</Label>
              <Input
                id="admin-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus
              />
            </div>
            {loginError && <p role="alert" className="text-sm text-destructive">{loginError}</p>}
            <Button type="submit" disabled={busy || !password} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {busy ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <Lock size={14} className="mr-1.5" />}
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            The password is set with the <code className="rounded bg-muted px-1">ADMIN_PASSWORD</code> environment
            variable (see .env.example). Login attempts are rate-limited.
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------ Dashboard ------------------------------- */

  const statCards = stats
    ? [
        { label: "Total tool uses", value: stats.totalUses.toLocaleString(), icon: TrendingUp },
        { label: "Today", value: stats.dailyUses.toLocaleString(), icon: BarChart3 },
        { label: "This week", value: stats.weeklyUses.toLocaleString(), icon: BarChart3 },
        { label: "This month", value: stats.monthlyUses.toLocaleString(), icon: BarChart3 },
        {
          label: "Success rate",
          value: stats.successRate === null ? "—" : `${stats.successRate}%`,
          icon: Gauge,
        },
        { label: "Failed processes", value: stats.failedUses.toLocaleString(), icon: AlertTriangle },
        { label: "Short links", value: stats.totalShortUrls.toLocaleString(), icon: ExternalLink },
        { label: "Link clicks", value: stats.totalShortUrlClicks.toLocaleString(), icon: Zap },
        { label: "Messages", value: stats.totalMessages.toLocaleString(), icon: Mail },
        { label: "Unread messages", value: stats.unreadMessages.toLocaleString(), icon: MailOpen },
      ]
    : [];

  const filteredMessages = messageFilter === "unread" ? messages.filter((m) => !m.isRead) : messages;

  return (
    <div className="container-page space-y-6 py-10">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-card-hover" role="status">
          <CheckCircle2 size={15} className="text-success" aria-hidden="true" /> {toast}
        </div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live analytics, system health, URL shortener and contact inbox.
            {lastUpdated && (
              <span className="ml-1 text-xs">· Updated {timeAgo(lastUpdated.toISOString())}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadAll()} disabled={refreshing}>
            {refreshing ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />}
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh((v) => !v)}
            className={autoRefresh ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
            aria-pressed={autoRefresh}
          >
            <Activity size={14} className="mr-1.5" />
            Live {autoRefresh ? "on" : "off"}
          </Button>
          <Button variant="outline" onClick={() => void logout()}>
            <LogOut size={14} className="mr-1.5" /> Sign out
          </Button>
        </div>
      </header>

      {stats === null ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-xl border bg-card p-4 shadow-card">
                <card.icon size={16} className="text-primary" aria-hidden="true" />
                <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            ))}
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="urls">URL Shortener</TabsTrigger>
              <TabsTrigger value="messages">
                Messages
                {stats.unreadMessages > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {stats.unreadMessages}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            {/* ================= Overview ================= */}
            <TabsContent value="overview" className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-xl border bg-card p-5">
                  <h2 className="text-sm font-semibold text-foreground">Daily traffic (14 days)</h2>
                  <MiniBar data={stats.dailyTraffic.map((d) => ({ label: d.date.slice(5), value: d.count }))} />
                </div>
                <div className="rounded-xl border bg-card p-5">
                  <h2 className="text-sm font-semibold text-foreground">Popular categories (30 days)</h2>
                  <div className="mt-3">
                    {stats.categoryTraffic.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No category usage recorded yet.</p>
                    ) : (
                      <HBar data={stats.categoryTraffic.map((c) => ({ label: c.category, value: c.count }))} />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-xl border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground">Most used tools</h2>
                    <a href="/api/admin/export?type=tools" className="focus-ring inline-flex items-center gap-1 rounded text-xs font-medium text-primary hover:underline">
                      <Download size={12} aria-hidden="true" /> CSV
                    </a>
                  </div>
                  <ol className="mt-3 divide-y">
                    {stats.popularTools.length === 0 ? (
                      <li className="py-3 text-sm text-muted-foreground">No tool usage recorded yet.</li>
                    ) : (
                      stats.popularTools.map((tool, i) => {
                        const definition = getTool(tool.slug);
                        return (
                          <li key={tool.slug} className="flex items-center justify-between gap-3 py-2.5">
                            <span className="flex min-w-0 items-center gap-2.5 text-sm">
                              <span className="w-5 text-xs font-bold text-muted-foreground">{i + 1}.</span>
                              <span className="truncate font-medium text-foreground">{definition?.name ?? tool.slug}</span>
                            </span>
                            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                              {tool.count.toLocaleString()}
                            </span>
                          </li>
                        );
                      })
                    )}
                  </ol>
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
                  {overview && overview.recentActivity.length > 0 ? (
                    <ul className="mt-3 divide-y">
                      {overview.recentActivity.map((event, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                          <span className="flex min-w-0 items-center gap-2">
                            {event.status === "error" ? (
                              <AlertTriangle size={14} className="shrink-0 text-destructive" aria-hidden="true" />
                            ) : (
                              <CheckCircle2 size={14} className="shrink-0 text-success" aria-hidden="true" />
                            )}
                            <span className="truncate font-medium text-foreground">{event.toolName}</span>
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(event.at)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No activity yet — events appear here as visitors use tools.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ================= URL Shortener ================= */}
            <TabsContent value="urls" className="space-y-4">
              {/* Create link */}
              <div className="rounded-xl border bg-card p-5">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Plus size={14} className="text-primary" aria-hidden="true" /> Create a short link
                </h2>
                <form
                  className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newUrl.trim().length >= 4) void createLink();
                  }}
                >
                  <div>
                    <Label htmlFor="new-url" className="sr-only">Destination URL</Label>
                    <Input
                      id="new-url"
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://example.com/long-url"
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-code" className="sr-only">Custom code (optional)</Label>
                    <Input
                      id="new-code"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="Custom code"
                      pattern="[a-zA-Z0-9_-]{4,32}"
                      title="4-32 characters: letters, numbers, dashes"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-expiry" className="sr-only">Expires in days (optional)</Label>
                    <Input
                      id="new-expiry"
                      type="number"
                      min={1}
                      max={3650}
                      value={newExpiry}
                      onChange={(e) => setNewExpiry(e.target.value)}
                      placeholder="Expires (days)"
                    />
                  </div>
                  <Button type="submit" disabled={creating || newUrl.trim().length < 4} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {creating ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Plus size={14} className="mr-1.5" />}
                    Create
                  </Button>
                </form>
                {createError && <p role="alert" className="mt-2 text-sm text-destructive">{createError}</p>}
                {createdLink && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-secondary/50 px-3 py-2">
                    <span className="font-mono text-sm font-semibold text-primary">{createdLink}</span>
                    <Button variant="ghost" size="sm" onClick={() => void copyText(createdLink, "Short link")} aria-label="Copy short link">
                      <Copy size={13} />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative max-w-md grow">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    value={urlSearch}
                    onChange={(e) => setUrlSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void loadAll()}
                    placeholder="Search by code or destination…"
                    className="pl-9"
                  />
                </div>
                <a href="/api/admin/export?type=urls" className="focus-ring inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-card transition-colors hover:text-primary">
                  <Download size={12} aria-hidden="true" /> Export CSV
                </a>
              </div>

              <div className="overflow-x-auto rounded-xl border bg-card">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Short code</th>
                      <th className="px-4 py-3 font-semibold">Destination</th>
                      <th className="px-4 py-3 font-semibold">Clicks</th>
                      <th className="px-4 py-3 font-semibold">Expires</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {urls.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No short links yet — create one above.</td>
                      </tr>
                    ) : (
                      urls.map((url) => (
                        <tr key={url.id} className="text-xs sm:text-sm">
                          <td className="px-4 py-3 font-mono font-semibold text-primary">
                            <a href={`/s/${url.shortCode}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              /s/{url.shortCode}
                            </a>
                          </td>
                          <td className="max-w-56 truncate px-4 py-3 text-muted-foreground" title={url.destinationUrl}>
                            {url.destinationUrl}
                          </td>
                          <td className="px-4 py-3 font-medium">{url.clickCount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {url.expiresAt ? new Date(url.expiresAt).toLocaleDateString("en-GB") : "Never"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", url.isActive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                              {url.isActive ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => void copyText(`${typeof window !== "undefined" ? window.location.origin : ""}/s/${url.shortCode}`, "Short link")} aria-label="Copy short link">
                                <Copy size={14} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => void toggleUrl(url.id, !url.isActive)} aria-label={url.isActive ? "Disable link" : "Enable link"}>
                                {url.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => void deleteUrl(url.id)} aria-label="Delete link" className="text-destructive hover:text-destructive">
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* ================= Messages ================= */}
            <TabsContent value="messages" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex rounded-lg border bg-card p-1" role="tablist" aria-label="Message filter">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={messageFilter === "all"}
                    onClick={() => setMessageFilter("all")}
                    className={cn("focus-ring rounded-md px-3 py-1.5 text-xs font-medium transition-colors", messageFilter === "all" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground")}
                  >
                    All ({messages.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={messageFilter === "unread"}
                    onClick={() => setMessageFilter("unread")}
                    className={cn("focus-ring rounded-md px-3 py-1.5 text-xs font-medium transition-colors", messageFilter === "unread" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground")}
                  >
                    Unread ({stats.unreadMessages})
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <a href="/api/admin/export?type=messages" className="focus-ring inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-card transition-colors hover:text-primary">
                    <Download size={12} aria-hidden="true" /> Export CSV
                  </a>
                  {stats.unreadMessages > 0 && (
                    <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
                      <CheckCheck size={14} className="mr-1.5" /> Mark all read
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {filteredMessages.length === 0 ? (
                  <p className="rounded-xl border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
                    {messageFilter === "unread" ? "No unread messages." : "No messages yet."}
                  </p>
                ) : (
                  filteredMessages.map((message) => (
                    <article
                      key={message.id}
                      className={cn("rounded-xl border bg-card p-4", !message.isRead && "border-primary/40 bg-secondary/30")}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{message.subject}</h3>
                          <p className="text-xs text-muted-foreground">
                            {message.name} · <a href={`mailto:${message.email}`} className="text-primary hover:underline">{message.email}</a>{" "}
                            · {new Date(message.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => void markRead(message.id, !message.isRead)}>
                            {message.isRead ? "Mark unread" : "Mark read"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => void deleteMessage(message.id)} aria-label="Delete message" className="text-destructive hover:text-destructive">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{message.message}</p>
                    </article>
                  ))
                )}
              </div>
            </TabsContent>

            {/* ================= System ================= */}
            <TabsContent value="system" className="space-y-5">
              {overview === null ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={22} />
                </div>
              ) : (
                <>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-xl border bg-card p-5">
                      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <Server size={14} className="text-primary" aria-hidden="true" /> Server health
                      </h2>
                      <dl className="mt-3 space-y-2.5 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Runtime</dt>
                          <dd className="font-medium text-foreground">{overview.server.runtime}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Uptime</dt>
                          <dd className="font-medium text-foreground">{overview.server.uptime}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Memory (RSS)</dt>
                          <dd className="font-medium text-foreground">{overview.server.memoryUsedMb ?? "—"}{overview.server.memoryUsedMb !== null ? " MB" : ""}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Heap used</dt>
                          <dd className="font-medium text-foreground">{overview.server.heapUsedMb ?? "—"}{overview.server.heapUsedMb !== null ? " MB" : ""}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Environment</dt>
                          <dd className="font-medium text-foreground">{overview.server.nodeEnv}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Database size</dt>
                          <dd className="font-medium text-foreground">{overview.server.dbSizeBytes !== null ? formatBytes(overview.server.dbSizeBytes) : "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Unique tools used</dt>
                          <dd className="font-medium text-foreground">{stats?.uniqueToolsUsed ?? "—"}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-xl border bg-card p-5">
                      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <Database size={14} className="text-primary" aria-hidden="true" /> Configuration status
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">Boolean status only — values are never exposed to the dashboard.</p>
                      <ul className="mt-3 space-y-2.5 text-sm">
                        {[
                          { label: "Admin password set (ADMIN_PASSWORD)", ok: overview.config.adminPasswordSet, hint: "Required for admin login" },
                          { label: "Session secret set (ADMIN_SECRET)", ok: overview.config.adminSecretSet, hint: "Signs admin session cookies" },
                          { label: "Site URL set (NEXT_PUBLIC_SITE_URL)", ok: overview.config.siteUrlSet, hint: "Canonical URLs & sitemap" },
                          { label: "Email delivery configured", ok: overview.config.emailConfigured, hint: "Contact form notifications" },
                        ].map((item) => (
                          <li key={item.label} className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-foreground">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.hint}</p>
                            </div>
                            <span className={cn("mt-0.5 flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", item.ok ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-600")}>
                              {item.ok ? <CheckCircle2 size={11} aria-hidden="true" /> : <AlertTriangle size={11} aria-hidden="true" />}
                              {item.ok ? "Set" : "Not set"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card p-5">
                    <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <AlertTriangle size={14} className="text-destructive" aria-hidden="true" /> Recent failed processes
                    </h2>
                    {overview.recentErrors.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">No failed tool processes recorded — all clear.</p>
                    ) : (
                      <ul className="mt-3 divide-y">
                        {overview.recentErrors.map((err, i) => (
                          <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                            <span className="truncate font-medium text-foreground">{err.toolName}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(err.at)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
