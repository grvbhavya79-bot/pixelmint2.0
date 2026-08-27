"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  hexToRgb, rgbToHex, rgbToHsl, hslToRgb, hslToHex,
  isValidHex, isValidRgbString, isValidHslString, parseRgbString, parseHslString,
} from "@/lib/color";
import { copyText } from "@/lib/download";

export default function ColorConverterTool() {
  const [hexValue, setHexValue] = useState("#2563EB");
  const [rgbValue, setRgbValue] = useState("rgb(37, 99, 235)");
  const [hslValue, setHslValue] = useState("hsl(217, 91%, 53%)");
  const [swatch, setSwatch] = useState("#2563EB");

  const valid = {
    hex: isValidHex(hexValue),
    rgb: isValidRgbString(rgbValue),
    hsl: isValidHslString(hslValue),
  };

  const syncFromHex = () => {
    const rgb = hexToRgb(hexValue);
    if (!rgb) return;
    const hsl = rgbToHsl(rgb);
    setRgbValue(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    setHslValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
    setSwatch(rgbToHex(rgb));
    toast.success("Converted from HEX");
  };

  const syncFromRgb = () => {
    const rgb = parseRgbString(rgbValue);
    if (!rgb) return;
    const hsl = rgbToHsl(rgb);
    setHexValue(rgbToHex(rgb));
    setHslValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
    setSwatch(rgbToHex(rgb));
    toast.success("Converted from RGB");
  };

  const syncFromHsl = () => {
    const hsl = parseHslString(hslValue);
    if (!hsl) return;
    const rgb = hslToRgb(hsl);
    setHexValue(rgbToHex(rgb));
    setRgbValue(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    setSwatch(hslToHex(hsl));
    toast.success("Converted from HSL");
  };

  const outputs = useMemo(
    () => [
      { label: "HEX", value: valid.hex ? hexValue.toUpperCase() : "—" },
      { label: "RGB", value: valid.rgb ? rgbValue : "—" },
      { label: "HSL", value: valid.hsl ? hslValue : "—" },
    ],
    [hexValue, rgbValue, hslValue, valid],
  );

  const rows: { id: string; label: string; value: string; onChange: (v: string) => void; onRun: () => void; valid: boolean; placeholder: string }[] = [
    { id: "hex", label: "HEX", value: hexValue, onChange: setHexValue, onRun: syncFromHex, valid: valid.hex, placeholder: "#2563EB" },
    { id: "rgb", label: "RGB", value: rgbValue, onChange: setRgbValue, onRun: syncFromRgb, valid: valid.rgb, placeholder: "rgb(37, 99, 235)" },
    { id: "hsl", label: "HSL", value: hslValue, onChange: setHslValue, onRun: syncFromHsl, valid: valid.hsl, placeholder: "hsl(217, 91%, 53%)" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="h-28 w-full rounded-xl border shadow-inner sm:h-auto sm:w-40" style={{ background: swatch }} aria-label="Color preview" role="img" />
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`cc-${row.id}`} className="text-[13px] font-medium">{row.label}</Label>
                <Input
                  id={`cc-${row.id}`}
                  value={row.value}
                  onChange={(e) => row.onChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && row.onRun()}
                  placeholder={row.placeholder}
                  className={`font-mono ${!row.valid ? "border-destructive/60" : ""}`}
                />
              </div>
              <Button variant="outline" onClick={row.onRun} disabled={!row.valid} aria-label={`Convert from ${row.label}`}>
                <ArrowRight size={14} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-[13px] font-medium text-foreground">Current conversion</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {outputs.map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => void copyText(o.value).then(() => toast.success(`${o.label} copied`))}
              className="focus-ring flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 text-left"
            >
              <span className="text-xs text-muted-foreground">{o.label}</span>
              <code className="font-mono text-xs font-semibold text-foreground">{o.value}</code>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Click any value to copy it. Press Enter in a field to convert from that format.</p>
      </div>
    </div>
  );
}
