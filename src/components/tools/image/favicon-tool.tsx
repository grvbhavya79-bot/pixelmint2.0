"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSlider } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadImageFile } from "@/lib/imaging";
import { copyText, saveZip } from "@/lib/download";

/** Build a multi-size .ico file (PNG-embedded ICO entries). */
function buildIco(sizes: number[], pngs: Record<number, Uint8Array>): Uint8Array {
  const entries = sizes.map((size) => ({ size, png: pngs[size] }));
  const headerSize = 6;
  const directorySize = 16 * entries.length;
  let offset = headerSize + directorySize;
  const total = offset + entries.reduce((s, e) => s + e.png.length, 0);
  const buffer = new ArrayBuffer(total);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true); // icon type
  view.setUint16(4, entries.length, true);
  entries.forEach((entry, i) => {
    const dir = headerSize + i * 16;
    const dim = entry.size >= 256 ? 0 : entry.size;
    view.setUint8(dir, dim);
    view.setUint8(dir + 1, dim);
    view.setUint8(dir + 2, 0);
    view.setUint8(dir + 3, 0);
    view.setUint16(dir + 4, 1, true);
    view.setUint16(dir + 6, 32, true);
    view.setUint32(dir + 8, entry.png.length, true);
    view.setUint32(dir + 12, offset, true);
    bytes.set(entry.png, offset);
    offset += entry.png.length;
  });
  return bytes;
}

const FAVICON_HTML = `<!-- Paste into your <head> -->
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="manifest" href="/site.webmanifest">`;

export default function FaviconTool() {
  const queue = useFileQueue(ACCEPT.images, { multiple: false, images: true });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("favicon-generator");
  const [padding, setPadding] = useState(4);
  const [bg, setBg] = useState("transparent");
  const [zipEntries, setZipEntries] = useState<{ name: string; blob: Blob }[] | null>(null);
  const [previews, setPreviews] = useState<Record<number, string>>({});

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const img = await loadImageFile(files[0].file);
      const sizes = [16, 32, 48, 64, 128, 180, 192, 512];
      const pngBytes: Record<number, Uint8Array> = {};
      const urls: Record<number, string> = {};
      const blobs: Record<number, Blob> = {};

      for (const size of sizes) {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        if (bg !== "transparent") {
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, size, size);
        }
        const inset = (padding / 100) * size;
        const inner = size - inset * 2;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        const scale = Math.max(inner / img.width, inner / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img.bitmap as CanvasImageSource, (size - dw) / 2, (size - dh) / 2, dw, dh);
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
        blobs[size] = blob;
        pngBytes[size] = new Uint8Array(await blob.arrayBuffer());
        urls[size] = URL.createObjectURL(blob);
      }

      const ico = buildIco([16, 32, 48, 64, 128, 256].map((s) => (s === 256 ? 512 : s)), {
        ...pngBytes,
        256: pngBytes[512],
      });
      const icoBlob = new Blob([ico as unknown as BlobPart], { type: "image/x-icon" });

      setPreviews(urls);
      setZipEntries([
        { name: "favicon.ico", blob: icoBlob },
        ...sizes.map((s) => ({
          name:
            s === 180
              ? "apple-touch-icon.png"
              : s === 192
                ? "android-chrome-192x192.png"
                : `favicon-${s}x${s}.png`,
          blob: blobs[s],
        })),
      ]);

      return {
        filename: "favicon.ico",
        blob: icoBlob,
        originalSize: files[0].file.size,
        extra: (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold text-foreground">Generated icon set</p>
            <div className="flex flex-wrap gap-3">
              {[16, 32, 48, 64, 128, 180].map((size) => (
                <div key={size} className="flex flex-col items-center gap-1">
                  { }
                  <img src={urls[size]} alt={`${size} pixel icon preview`} width={Math.min(56, size)} height={Math.min(56, size)} className="rounded border" />
                  <span className="text-[10px] text-muted-foreground">{size}px</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">HTML code for your &lt;head&gt;</p>
                <Button variant="ghost" size="sm" onClick={() => void copyText(FAVICON_HTML)}>
                  <Copy size={13} className="mr-1" /> Copy
                </Button>
              </div>
              <pre className="mt-2 overflow-x-auto scrollbar-thin text-[11px] leading-relaxed text-muted-foreground">{FAVICON_HTML}</pre>
            </div>
            {zipEntries !== null ? null : null}
            <Button variant="outline" size="sm" onClick={() => zipEntries && void saveZip(zipEntries, "favicon-pack.zip")}>
              <Download size={13} className="mr-1" /> Download all as ZIP
            </Button>
          </div>
        ),
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setZipEntries(null);
    setPreviews({});
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="image/*" label="Drop your logo or icon here" hint="Square images (PNG with transparency) give the best favicons" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
                <OptionSlider label="Padding" value={padding} onValueChange={setPadding} min={0} max={20} unit="%" />
                <div className="space-y-1.5">
                  <label htmlFor="favicon-bg" className="text-[13px] font-medium text-foreground">Background</label>
                  <select id="favicon-bg" value={bg} onChange={(e) => setBg(e.target.value)} className="focus-ring h-9 w-full rounded-md border bg-background px-2 text-sm">
                    <option value="transparent">Transparent</option>
                    <option value="#FFFFFF">White</option>
                    <option value="#0F172A">Dark</option>
                    <option value="#2563EB">Brand blue</option>
                  </select>
                </div>
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Generate Favicons
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Generating icon set…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
