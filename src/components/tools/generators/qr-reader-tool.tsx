"use client";

import { useState } from "react";
import { ExternalLink, Mail, Phone, ScanLine, Wifi } from "lucide-react";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, useFileQueue } from "@/components/tools/shared/tool-runner";
import { loadImageFile } from "@/lib/imaging";
import jsQR from "jsqr";
import { trackToolUse } from "@/lib/track";
import { copyText } from "@/lib/download";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface QrResult {
  data: string;
  kind: "url" | "wifi" | "email" | "phone" | "text";
}

function classify(data: string): QrResult["kind"] {
  if (/^https?:\/\//i.test(data)) return "url";
  if (/^WIFI:/i.test(data)) return "wifi";
  if (/^mailto:/i.test(data)) return "email";
  if (/^tel:/i.test(data)) return "phone";
  return "text";
}

function parseWifi(data: string): Record<string, string> {
  const result: Record<string, string> = {};
  const m = data.match(/^WIFI:(.*);;?$/i);
  if (m) {
    for (const part of m[1].split(/(?<!\\);/)) {
      const [key, ...rest] = part.split(":");
      if (key && rest.length) result[key] = rest.join(":").replace(/\\([;,:"])/g, "$1");
    }
  }
  return result;
}

export default function QrReaderTool() {
  const queue = useFileQueue({ accept: ["png", "jpeg", "webp", "bmp"], maxSize: 25 * 1024 * 1024 }, { multiple: false, images: true });
  const { files, addFiles, removeFile, error, setError } = queue;
  const [result, setResult] = useState<QrResult | null>(null);
  const [scanning, setScanning] = useState(false);

  const scan = async () => {
    if (!files[0]) return;
    setScanning(true);
    setResult(null);
    try {
      const img = await loadImageFile(files[0].file);
      const canvas = document.createElement("canvas");
      // upscale small images for better detection
      const scale = Math.max(1, Math.min(4, 900 / img.width));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img.bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
      if (!code) {
        // retry with contrast boost
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          const v = gray > 128 ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = v;
        }
        code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
      }
      if (code?.data) {
        setResult({ data: code.data, kind: classify(code.data) });
        trackToolUse("qr-code-reader");
      } else {
        setError("No QR code was detected. Use a sharper, well-lit image where the QR fills a good part of the frame.");
      }
    } catch {
      setError("The image could not be processed. Try a different file.");
    } finally {
      setScanning(false);
    }
  };

  const wifi = result?.kind === "wifi" ? parseWifi(result.data) : null;

  return (
    <div className="space-y-4">
      <FileDropzone onFiles={(fs) => { void addFiles(fs).then(() => { setResult(null); setError(null); }); }} accept="image/*" label="Drop a QR code image here" hint="PNG, JPG, WEBP — decoded entirely offline in your browser" disabled={scanning} />
      {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
      {files[0] && (
        <>
          <FileListRow item={files[0]} onRemove={() => { removeFile(files[0].id); setResult(null); }} />
          <Button onClick={() => void scan()} disabled={scanning} className="bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
            <ScanLine size={16} className="mr-1.5" />
            {scanning ? "Scanning…" : "Detect QR Code"}
          </Button>
        </>
      )}

      {result && (
        <div className="rounded-2xl border border-success/30 bg-success/5 p-5" role="status">
          <p className="text-sm font-semibold text-foreground">QR code detected</p>
          <p className="mt-2 select-all break-all rounded-lg bg-card/70 p-3 font-mono text-sm text-foreground">{result.data}</p>

          {result.kind === "url" && (
            <a href={result.data} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <ExternalLink size={14} /> Open link in new tab
            </a>
          )}
          {result.kind === "wifi" && wifi && (
            <dl className="mt-3 space-y-1 text-sm">
              {wifi.S && <div className="flex gap-2"><dt className="flex items-center gap-1 text-muted-foreground"><Wifi size={13} /> Network:</dt><dd className="font-medium text-foreground">{wifi.S}</dd></div>}
              {wifi.T && <div className="flex gap-2"><dt className="text-muted-foreground">Security:</dt><dd className="font-medium text-foreground">{wifi.T}</dd></div>}
              {wifi.P && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Password:</dt>
                  <dd className="font-mono font-medium text-foreground">{wifi.P}</dd>
                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => void copyText(wifi.P!).then(() => toast.success("Password copied"))}>Copy</Button>
                </div>
              )}
            </dl>
          )}
          {result.kind === "email" && (
            <a href={result.data} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <Mail size={14} /> Open in email app
            </a>
          )}
          {result.kind === "phone" && (
            <a href={result.data} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <Phone size={14} /> Call number
            </a>
          )}

          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={() => void copyText(result.data).then(() => toast.success("Content copied"))}>
              Copy content
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
