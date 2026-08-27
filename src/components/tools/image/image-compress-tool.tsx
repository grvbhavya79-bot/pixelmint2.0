"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSelect, OptionSlider } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadImageFile, canvasToBlob, type OutputFormat } from "@/lib/imaging";
import { stripExtension } from "@/lib/format";

const QUALITY_PRESETS = [
  { value: "0.85", label: "High quality" },
  { value: "0.7", label: "Balanced (recommended)" },
  { value: "0.55", label: "Compact" },
  { value: "0.4", label: "Maximum compression" },
];

export default function ImageCompressTool() {
  const queue = useFileQueue(ACCEPT.images, { multiple: true, images: true });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("image-compressor");
  const [quality, setQuality] = useState("0.7");
  const [format, setFormat] = useState("auto");

  const run = async () => {
    if (files.length === 0) return;
    await wf.run(async () => {
      const q = parseFloat(quality);
      const outputs: { name: string; blob: Blob }[] = [];
      const previews: { name: string; before: number; after: number }[] = [];

      for (const item of files) {
        const image = await loadImageFile(item.file);
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext("2d")!.drawImage(image.bitmap as CanvasImageSource, 0, 0);

        // PNG rarely benefits from re-encode at same format — convert to WEBP for real savings
        let target: OutputFormat;
        if (format === "auto") {
          target = item.type === "png" ? "webp" : item.type === "webp" ? "webp" : "jpeg";
        } else {
          target = format as OutputFormat;
        }
        if (target === "jpeg") {
          // flatten transparency
          const flat = document.createElement("canvas");
          flat.width = canvas.width;
          flat.height = canvas.height;
          const fctx = flat.getContext("2d")!;
          fctx.fillStyle = "#ffffff";
          fctx.fillRect(0, 0, flat.width, flat.height);
          fctx.drawImage(canvas, 0, 0);
          canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
          canvas.getContext("2d")!.drawImage(flat, 0, 0);
        }
        const blob = await canvasToBlob(canvas, target, q);
        const name = `${stripExtension(item.file.name)}-compressed.${target === "jpeg" ? "jpg" : target}`;
        outputs.push({ name, blob });
        previews.push({ name: item.file.name, before: item.file.size, after: blob.size });
      }

      const totalBefore = previews.reduce((s, p) => s + p.before, 0);
      const totalAfter = previews.reduce((s, p) => s + p.after, 0);
      const summary = (
        <div className="mt-3">
          <div className="max-h-40 space-y-1 overflow-y-auto scrollbar-thin rounded-lg bg-card/70 p-2">
            {previews.map((p) => (
              <div key={p.name} className="flex justify-between gap-3 text-[11px] text-muted-foreground">
                <span className="truncate">{p.name}</span>
                <span className="shrink-0 font-mono">
                  {(p.before / 1024).toFixed(0)} KB → {(p.after / 1024).toFixed(0)} KB
                  {p.after < p.before ? ` (-${Math.round((1 - p.after / p.before) * 100)}%)` : ""}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Total: {(totalBefore / 1024).toFixed(0)} KB → {(totalAfter / 1024).toFixed(0)} KB</p>
        </div>
      );

      if (outputs.length === 1) {
        return { filename: outputs[0].name, blob: outputs[0].blob, originalSize: previews[0].before, extra: summary };
      }
      return {
        result: { filename: outputs[0].name, blob: outputs[0].blob, originalSize: totalBefore, extra: summary },
        additional: outputs.slice(1),
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="image/*" multiple label="Drop images here to compress" hint="JPG, PNG and WEBP · batch supported" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files.length > 0 && (
            <>
              <div className="space-y-2">
                {files.map((f) => (
                  <FileListRow key={f.id} item={f} onRemove={() => removeFile(f.id)} />
                ))}
              </div>
              <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
                <OptionSelect label="Quality" value={quality} onValueChange={setQuality} options={QUALITY_PRESETS} id="ic-quality" />
                <OptionSelect
                  label="Output format"
                  value={format}
                  onValueChange={setFormat}
                  options={[
                    { value: "auto", label: "Smart (keep JPG/WEBP, PNG→WEBP)" },
                    { value: "jpeg", label: "JPG" },
                    { value: "webp", label: "WEBP" },
                  ]}
                  id="ic-format"
                />
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Compress {files.length} Image{files.length === 1 ? "" : "s"}
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Compressing images…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} additionalResults={wf.additional} onReset={reset} zipName="compressed-images.zip" />}
    </div>
  );
}
