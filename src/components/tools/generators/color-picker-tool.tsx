"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  rgbToHex, rgbToHsl, hexToRgb, isValidHex, complementary, analogous, shadeScale, tintScale, contrastRatio,
} from "@/lib/color";
import { copyText } from "@/lib/download";

export default function ColorPickerTool() {
  const [hex, setHex] = useState("#2563EB");
  const rgb = hexToRgb(hex) ?? { r: 37, g: 99, b: 235 };
  const hsl = rgbToHsl(rgb);
  const comp = complementary(hex);
  const analog = analogous(hex);

  const formats = [
    { label: "HEX", value: rgbToHex(rgb) },
    { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: "RGBA", value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)` },
    { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { label: "CSS variable", value: `--color: ${rgbToHex(rgb).toLowerCase()};` },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <label htmlFor="color-input" className="text-[13px] font-medium text-foreground">Pick a color</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              id="color-input"
              type="color"
              value={isValidHex(hex) ? hex : "#2563EB"}
              onChange={(e) => setHex(e.target.value.toUpperCase())}
              className="h-16 w-24 cursor-pointer rounded-lg border bg-background p-1"
              aria-label="Color picker"
            />
            <div>
              <input
                type="text"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                aria-label="Hex value"
                className="focus-ring h-10 w-32 rounded-lg border bg-background px-3 font-mono text-sm"
              />
              {!isValidHex(hex) && <p className="mt-1 text-xs text-destructive">Invalid hex</p>}
            </div>
            <div className="ml-auto h-16 w-16 rounded-lg border shadow-inner" style={{ background: hex }} aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-1.5 rounded-xl border bg-card p-4">
          <p className="text-[13px] font-medium text-foreground">All formats</p>
          {formats.map((f) => (
            <div key={f.label} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
              <span className="w-24 text-xs text-muted-foreground">{f.label}</span>
              <code className="flex-1 truncate font-mono text-xs font-medium text-foreground">{f.value}</code>
              <button type="button" onClick={() => void copyText(f.value).then(() => toast.success(`${f.label} copied`))} className="focus-ring rounded p-1 text-muted-foreground hover:text-primary" aria-label={`Copy ${f.label} value`}>
                <Copy size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-[13px] font-medium text-foreground">Shades &amp; tints</p>
          <div className="mt-2 grid grid-cols-10 gap-1">
            {[...shadeScale(hex).reverse().slice(1), rgbToHex(rgb), ...tintScale(hex).slice(1)].map((c, i) => (
              <button
                key={c + i}
                type="button"
                onClick={() => setHex(c)}
                title={c}
                aria-label={`Use color ${c}`}
                className="focus-ring h-10 rounded border"
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>darker</span>
            <span>lighter</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-[13px] font-medium text-foreground">Complementary</p>
            {comp && (
              <button type="button" onClick={() => setHex(comp)} className="focus-ring mt-2 h-14 w-full rounded-lg border" style={{ background: comp }} aria-label={`Use complementary color ${comp}`}>
                <span className="text-xs font-medium mix-blend-difference">{comp}</span>
              </button>
            )}
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-[13px] font-medium text-foreground">Analogous</p>
            {analog && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {analog.map((c) => (
                  <button key={c} type="button" onClick={() => setHex(c)} className="focus-ring h-14 rounded-lg border" style={{ background: c }} aria-label={`Use analogous color ${c}`}>
                    <span className="text-[10px] font-medium mix-blend-difference">{c}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-[13px] font-medium text-foreground">Contrast check</p>
          <div className="mt-2 space-y-2">
            {[
              { label: "on white", fg: hex, bg: "#FFFFFF", ratio: contrastRatio(hex, "#FFFFFF") },
              { label: "on black", fg: hex, bg: "#000000", ratio: contrastRatio(hex, "#000000") },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ background: row.bg }}>
                <span className="text-sm font-medium" style={{ color: row.fg }}>Sample text {row.label}</span>
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold" style={{ color: row.fg }}>
                  {row.ratio ? `${row.ratio.toFixed(2)}:1 ${row.ratio >= 4.5 ? "· AA" : row.ratio >= 3 ? "· AA large" : "· fail"}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
