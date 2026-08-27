"use client";

import { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OptionSelect, OptionSwitch } from "@/components/tools/shared/option-controls";
import { copyText } from "@/lib/download";
import { trackToolUse } from "@/lib/track";

function randomUuid(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  const bytes = c.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

export default function UuidTool() {
  const [count, setCount] = useState("5");
  const [uppercase, setUppercase] = useState(false);
  const [noHyphens, setNoHyphens] = useState(false);
  const [uuids, setUuids] = useState<string[]>(() => Array.from({ length: 5 }, randomUuid));

  const generate = () => {
    const n = Math.min(500, Math.max(1, parseInt(count, 10) || 1));
    const list = Array.from({ length: n }, () => {
      let id = randomUuid();
      if (uppercase) id = id.toUpperCase();
      if (noHyphens) id = id.replace(/-/g, "");
      return id;
    });
    setUuids(list);
    trackToolUse("uuid-generator");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
        <OptionSelect
          label="How many?"
          value={count}
          onValueChange={setCount}
          options={["1", "5", "10", "25", "50", "100"].map((n) => ({ value: n, label: `${n} UUID${n === "1" ? "" : "s"}` }))}
          id="uuid-count"
        />
        <OptionSwitch label="Uppercase" checked={uppercase} onCheckedChange={setUppercase} id="uuid-upper" />
        <OptionSwitch label="No hyphens" checked={noHyphens} onCheckedChange={setNoHyphens} id="uuid-hyphens" />
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Button onClick={generate} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <RefreshCw size={14} className="mr-1.5" /> Generate UUIDs
        </Button>
        <Button
          variant="outline"
          onClick={() => void copyText(uuids.join("\n")).then(() => toast.success(`Copied ${uuids.length} UUIDs`))}
        >
          <Copy size={14} className="mr-1.5" /> Copy all
        </Button>
      </div>

      <ul className="max-h-80 space-y-1.5 overflow-y-auto scrollbar-thin">
        {uuids.map((id, i) => (
          <li key={id + i} className="group flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
            <span className="select-all font-mono text-sm text-foreground">{id}</span>
            <button
              type="button"
              onClick={() => void copyText(id).then(() => toast.success("Copied"))}
              aria-label={`Copy UUID ${id}`}
              className="focus-ring rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
            >
              <Copy size={13} />
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        UUID v4 identifiers are generated with the browser&apos;s cryptographically secure random source (Web Crypto API).
      </p>
    </div>
  );
}
