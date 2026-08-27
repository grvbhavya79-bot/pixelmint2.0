"use client";

import { useEffect } from "react";

/** Registers the service worker for offline support of client-side tools. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is a progressive enhancement */
      });
    }
  }, []);
  return null;
}
