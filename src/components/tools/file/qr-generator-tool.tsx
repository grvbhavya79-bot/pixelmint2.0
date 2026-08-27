"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copyText, saveBlob } from "@/lib/download";
import { trackToolUse } from "@/lib/track";
import { cn } from "@/lib/utils";

type QrMode = "url" | "text" | "email" | "phone" | "wifi" | "vcard";

const MODES: { id: QrMode; label: string }[] = [
  { id: "url", label: "URL" },
  { id: "text", label: "Text" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "wifi", label: "Wi-Fi" },
];

export default function QrGeneratorTool() {
  const [mode, setMode] = useState<QrMode>("url");
  const [fields, setFields] = useState<Record<string, string>>({
    url: "https://",
    text: "",
    email: "",
    emailSubject: "",
    emailBody: "",
    phone: "",
    ssid: "",
    wifiPassword: "",
    wifiEncryption: "WPA",
  });
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [ecc, setEcc] = useState<"L" | "M" | "Q" | "H">("M");
  const [dark, setDark] = useState("#0F172A");
  const [light, setLight] = useState("#FFFFFF");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const payload = useCallback((): string | null => {
    switch (mode) {
      case "url": {
        const url = fields.url.trim();
        if (!url) return null;
        return /^https?:\/\//.test(url) ? url : `https://${url}`;
      }
      case "text":
        return fields.text.trim() || null;
      case "email": {
        const email = fields.email.trim();
        if (!email) return null;
        const params = new URLSearchParams();
        if (fields.emailSubject.trim()) params.set("subject", fields.emailSubject.trim());
        if (fields.emailBody.trim()) params.set("body", fields.emailBody.trim());
        const query = params.toString();
        return `mailto:${email}${query ? `?${query}` : ""}`;
      }
      case "phone": {
        const phone = fields.phone.replace(/[^\d+]/g, "");
        return phone ? `tel:${phone}` : null;
      }
      case "wifi": {
        const ssid = fields.ssid.trim();
        if (!ssid) return null;
        const escape = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
        return `WIFI:T:${fields.wifiEncryption};S:${escape(ssid)};${fields.wifiEncryption !== "nopass" ? `P:${escape(fields.wifiPassword)};` : ""};`;
      }
      default:
        return null;
    }
  }, [mode, fields]);

  useEffect(() => {
    const data = payload();
    if (!data) {
      void Promise.resolve().then(() => {
        setDataUrl(null);
        setSvg(null);
      });
      return;
    }
    const options = {
      errorCorrectionLevel: ecc,
      margin,
      width: size,
      color: { dark, light },
    } as const;
    const canvas = canvasRef.current;
    if (canvas) {
      void QRCode.toCanvas(canvas, data, options)
        .then(() => {
          setError(null);
          setDataUrl(canvas.toDataURL("image/png"));
        })
        .catch(() => {
          setError("The content is too long for a QR code — shorten it and try again.");
          setDataUrl(null);
        });
    }
    QRCode.toString(data, { ...options, type: "svg", width: size }, (err, svgString) => {
      if (!err) setSvg(svgString);
    });
    trackToolUse("qr-code-generator");
  }, [payload, size, margin, ecc, dark, light]);

  const field = (key: string, label: string, props: { type?: string; placeholder?: string } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`qr-${key}`} className="text-[13px] font-medium">{label}</Label>
      <Input
        id={`qr-${key}`}
        type={props.type ?? "text"}
        value={fields[key]}
        placeholder={props.placeholder}
        onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  const ready = !!payload();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div role="tablist" aria-label="QR content type" className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium",
                mode === m.id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          {mode === "url" && field("url", "Website URL", { placeholder: "https://pixelmint.fun" })}
          {mode === "text" && (
            <div className="space-y-1.5">
              <Label htmlFor="qr-text" className="text-[13px] font-medium">Text content</Label>
              <textarea
                id="qr-text"
                value={fields.text}
                onChange={(e) => setFields((f) => ({ ...f, text: e.target.value }))}
                className="focus-ring min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Any text, up to ~2000 characters"
              />
            </div>
          )}
          {mode === "email" && (
            <>
              {field("email", "Email address", { type: "email", placeholder: "hello@pixelmint.fun" })}
              {field("emailSubject", "Subject (optional)")}
              {field("emailBody", "Body (optional)")}
            </>
          )}
          {mode === "phone" && field("phone", "Phone number", { type: "tel", placeholder: "+91 98765 43210" })}
          {mode === "wifi" && (
            <>
              {field("ssid", "Network name (SSID)")}
              {field("wifiPassword", "Password")}
              <div className="space-y-1.5">
                <Label htmlFor="qr-enc" className="text-[13px] font-medium">Security</Label>
                <select
                  id="qr-enc"
                  value={fields.wifiEncryption}
                  onChange={(e) => setFields((f) => ({ ...f, wifiEncryption: e.target.value }))}
                  className="focus-ring h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Open (no password)</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="qr-size" className="text-[13px] font-medium">Size</Label>
            <select id="qr-size" value={size} onChange={(e) => setSize(parseInt(e.target.value, 10))} className="focus-ring h-9 w-full rounded-md border bg-background px-2 text-sm">
              {[256, 512, 1024, 2048].map((s) => <option key={s} value={s}>{s}px</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qr-ecc" className="text-[13px] font-medium">Error correction</Label>
            <select id="qr-ecc" value={ecc} onChange={(e) => setEcc(e.target.value as "L" | "M" | "Q" | "H")} className="focus-ring h-9 w-full rounded-md border bg-background px-2 text-sm">
              <option value="L">L — 7%</option>
              <option value="M">M — 15%</option>
              <option value="Q">Q — 25%</option>
              <option value="H">H — 30%</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qr-dark" className="text-[13px] font-medium">Code color</Label>
            <input id="qr-dark" type="color" value={dark} onChange={(e) => setDark(e.target.value)} className="h-9 w-full cursor-pointer rounded-md border bg-background p-1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qr-light" className="text-[13px] font-medium">Background</Label>
            <input id="qr-light" type="color" value={light} onChange={(e) => setLight(e.target.value)} className="h-9 w-full cursor-pointer rounded-md border bg-background p-1" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col items-center rounded-xl border bg-card p-6 shadow-card">
          {ready ? (
            <canvas ref={canvasRef} className="max-w-full rounded-lg" aria-label="Generated QR code preview" role="img" />
          ) : (
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
          )}
          {!ready && (
            <div className="flex h-56 w-full items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
              Fill in the content — your QR code appears here
            </div>
          )}
          {error && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p>}
          {payload() && ready && (
            <p className="mt-3 max-w-full truncate rounded-lg bg-muted/60 px-3 py-1.5 font-mono text-[11px] text-muted-foreground" title={payload() ?? ""}>
              {payload()}
            </p>
          )}
        </div>
        {ready && dataUrl && (
          <div className="flex flex-wrap justify-center gap-2.5">
            <Button
              onClick={async () => {
                const blob = await (await fetch(dataUrl)).blob();
                saveBlob(blob, `qr-code-${size}.png`);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download size={14} className="mr-1.5" /> Download PNG
            </Button>
            {svg && (
              <>
                <Button variant="outline" onClick={() => saveBlob(new Blob([svg], { type: "image/svg+xml" }), "qr-code.svg")}>
                  <Download size={14} className="mr-1.5" /> Download SVG
                </Button>
                <Button variant="outline" onClick={() => void copyText(svg).then(() => toast.success("SVG code copied"))}>
                  <Copy size={14} className="mr-1.5" /> Copy SVG code
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
