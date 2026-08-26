"use client";

/** Fire-and-forget anonymous usage analytics (records only tool slug + status). */
export function trackToolUse(slug: string, status: "success" | "error" = "success"): void {
  try {
    const body = JSON.stringify({ slug, status });
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    /* analytics must never break a tool */
  }
}
