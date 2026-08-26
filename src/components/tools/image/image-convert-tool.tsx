"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSelect, OptionSlider } from "@/components/tools/shared/option-controls";
import { ACCEPT, type SniffedType } from "@/lib/file-validate";
import { loadImageFile, canvasToBlob, type OutputFormat } from "@/lib/imaging";
import { stripExtension } from "@/lib/format";

const FORMAT_OPTIONS = [
  { value: "png", label: "PNG — lossless, transparency" },
  { value: "jpeg", label: "JPG — photos, small files" },
  { value: "webp", label: "WEBP — modern, smallest" },
  { value: "bmp", label: "BMP — uncompressed bitmap" },
  { value: "gif", label: "GIF — single-frame image" },
];

interface Props {
  /** fixed target format (for the dedicated converter tools) */
  target?: string;
  accept?: SniffedType[];
}

export default function ImageConvertTool({ target = "any", accept }: Props) {
  const fixed = target !== "any";
  const queue = useFileQueue(
    accept ? { accept, maxSize: 25 * 1024 * 1024 } : ACCEPT.images,
    { multiple: true, images: true },
  );
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow(
    fixed ? (target === "png" ? "png-converter" : `${target}-converter`) : "image-converter",
  );
  const [format, setFormat] = useState(fixed && target !== "any" ? target : "png");
  const [quality, setQuality] = useState(90);

  const slugForTracking = fixed ? undefined : "image-converter";

  const run = async () => {
    if (files.length === 0) return;
    await wf.run(async () => {
      const targetFormat = format as OutputFormat;
      const outputs: { name: string; blob: Blob }[] = [];
      for (const item of files) {
        const img = await loadImageFile(item.file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        if (targetFormat === "jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img.bitmap as CanvasImageSource, 0, 0);
        const blob = await canvasToBlob(canvas, targetFormat, quality / 100);
        const ext = targetFormat === "jpeg" ? "jpg" : targetFormat;
        outputs.push({ name: `${stripExtension(item.file.name)}.${ext}`, blob });
      }
      if (outputs.length === 1) {
        return { filename: outputs[0].name, blob: outputs[0].blob, originalSize: files[0].file.size };
      }
      return {
        result: { filename: outputs[0].name, blob: outputs[0].blob },
        additional: outputs.slice(1),
      };
    });
    void slugForTracking;
  };

  const reset = () => {
    clear();
    wf.reset();
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="image/*" multiple label="Drop images here to convert" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files.length > 0 && (
            <>
              <ul className="space-y-2">
                {files.map((f) => (
                  <FileListRow key={f.id} item={f} onRemove={() => removeFile(f.id)} />
                ))}
              </ul>
              <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
                <OptionSelect
                  label="Convert to"
                  value={format}
                  onValueChange={setFormat}
                  options={fixed ? FORMAT_OPTIONS.filter((f) => f.value === format) : FORMAT_OPTIONS}
                  id="conv-format"
                  hint={fixed ? `Fixed output format for this tool` : undefined}
                />
                {(format === "jpeg" || format === "webp") && (
                  <OptionSlider label="Quality" value={quality} onValueChange={setQuality} min={10} max={100} unit="%" />
                )}
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Convert to {format.toUpperCase()} ({files.length})
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Converting images…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} additionalResults={wf.additional} onReset={reset} zipName="converted-images.zip" />}
    </div>
  );
}
