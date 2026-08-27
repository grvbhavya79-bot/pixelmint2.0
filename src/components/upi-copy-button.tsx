"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function UpiCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for older browsers / non-secure contexts
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "UPI ID copied" : `Copy UPI ID ${value}`}
      className="focus-ring inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-mint"
    >
      {copied ? (
        <>
          <Check size={15} className="text-success" aria-hidden="true" />
          Copied!
        </>
      ) : (
        <>
          <Copy size={15} className="text-primary" aria-hidden="true" />
          Copy UPI ID
        </>
      )}
    </button>
  );
}
