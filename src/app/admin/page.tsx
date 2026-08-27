"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3, ExternalLink, Eye, EyeOff, Loader2, Lock, LogOut, Mail, MessageSquare,
  Search, Trash2, TrendingUp,
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
            className="w-full rounded-t bg-primary/80 transition-all group-hover:bg-primary"
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

/* ------------------------------- Dashboard ------------------------------- */

interface Stats {
  totalUses: number;
  dailyUses: number;
  weeklyUses: number;
  monthlyUses: number;
  failedUses: number;
  totalShortUrls: number;
  totalShortUrlClicks: number;
  unreadMessages: number;
  popularTools: { slug: string; count: number }[];
  dailyTraffic: { date: string; count: number }[];
  categoryTraffic: { category: string; count: number }[];
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

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [urls, setUrls] = useState<ShortUrlRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [urlSearch, setUrlSearch] = useState("");
  const router = useRouter();

  const loadAll = useCallback(async () => {
    const [statsRes, urlsRes, messagesRes] = await Promise.all([
      fetch("/api/admin/analytics"),
      fetch(`/api/admin/urls${urlSearch ? `?q=${encodeURIComponent(urlSearch)}` : ""}`),
      fetch("/api/admin/messages"),
    ]);
    if (statsRes.status === 401) {
      setAuthed(false);
      return;
    }
    const statsJson = await statsRes.json();
    const urlsJson = await urlsRes.json();
    const messagesJson = await messagesRes.json();
    if (statsJson.success) setStats(statsJson.stats);
    if (urlsJson.success) setUrls(urlsJson.urls);
    if (messagesJson.success) setMessages(messagesJson.messages);
  }, [urlSearch]);

  useEffect(() => {
    void loadAll().then(() => setAuthed((a) => (a === false ? false : true)));
     
  }, []);

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
    router.refresh();
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

  const markRead = async (id: string, isRead: boolean) => {
    await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isRead }),
    });
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

  const statCards = stats
    ? [
        { label: "Total tool uses", value: stats.totalUses.toLocaleString(), icon: TrendingUp },
        { label: "Today", value: stats.dailyUses.toLocaleString(), icon: BarChart3 },
        { label: "This week", value: stats.weeklyUses.toLocaleString(), icon: BarChart3 },
        { label: "This month", value: stats.monthlyUses.toLocaleString(), icon: BarChart3 },
        { label: "Failed processes", value: stats.failedUses.toLocaleString(), icon: MessageSquare },
        { label: "Short links", value: stats.totalShortUrls.toLocaleString(), icon: ExternalLink },
        { label: "Link clicks", value: stats.totalShortUrlClicks.toLocaleString(), icon: ExternalLink },
        { label: "Messages", value: stats.unreadMessages.toLocaleString(), icon: Mail },
      ]
    : [];

  return (
    <div className="container-page space-y-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Usage analytics, URL shortener management and contact inbox.</p>
        </div>
        <Button variant="outline" onClick={() => void logout()}>
          <LogOut size={14} className="mr-1.5" /> Sign out
        </Button>
      </header>

      {stats === null ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-xl border bg-card p-5">
                  <h2 className="text-sm font-semibold text-foreground">Daily traffic (14 days)</h2>
                  <MiniBar data={stats.dailyTraffic.map((d) => ({ label: d.date.slice(5), value: d.count }))} />
                </div>
                <div className="rounded-xl border bg-card p-5">
                  <h2 className="text-sm font-semibold text-foreground">Popular categories (30 days)</h2>
                  <div className="mt-3">
                    <HBar data={stats.categoryTraffic.map((c) => ({ label: c.category, value: c.count }))} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground">Most used tools</h2>
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
                            <span className="truncate font-medium text-foreground">
                              {definition?.name ?? tool.slug}
                            </span>
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
            </TabsContent>

            <TabsContent value="urls" className="space-y-4">
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  value={urlSearch}
                  onChange={(e) => setUrlSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void loadAll()}
                  placeholder="Search by code or destination…"
                  className="pl-9"
                />
              </div>
              <div className="overflow-x-auto rounded-xl border bg-card">
                <table className="w-full min-w-[720px] text-sm">
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
                        <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No short links yet.</td>
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

            <TabsContent value="messages">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="rounded-xl border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
                    No messages yet.
                  </p>
                ) : (
                  messages.map((message) => (
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
          </Tabs>
        </>
      )}
    </div>
  );
}
