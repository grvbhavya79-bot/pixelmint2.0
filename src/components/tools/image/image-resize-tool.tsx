"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionInput, OptionSelect } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadImageFile, canvasToBlob, type OutputFormat } from "@/lib/imaging";
import { stripExtension } from "@/lib/format";

export default function ImageResizeTool() {
  const queue = useFileQueue(ACCEPT.images, { multiple: true, images: true });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("image-resizer");
  const [mode, setMode] = useState("pixels");
  const [width, setWidth] = useState("1280");
  const [height, setHeight] = useState("720");
  const [percent, setPercent] = useState("50");
  const [lockRatio, setLockRatio] = useState(true);
  const [format, setFormat] = useState("auto");
  const [firstDims, setFirstDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (files[0]) {
      void loadImageFile(files[0].file).then((img) => {
        setFirstDims({ w: img.width, h: img.height });
        if (mode === "pixels" && lockRatio) setHeight(String(Math.round((img.height / img.width) * parseInt(width || "0", 10) || img.height)));
      });
    }
     
  }, [files[0]?.id]);

  const onWidthChange = (v: string) => {
    setWidth(v);
    if (lockRatio && firstDims && v) {
      setHeight(String(Math.round((firstDims.h / firstDims.w) * parseInt(v, 10))));
    }
  };
  const onHeightChange = (v: string) => {
    setHeight(v);
    if (lockRatio && firstDims && v) {
      setWidth(String(Math.round((firstDims.w / firstDims.h) * parseInt(v, 10))));
    }
  };

  const run = async () => {
    if (files.length === 0) return;
    await wf.run(async () => {
      const outputs: { name: string; blob: Blob }[] = [];
      for (const item of files) {
        const image = await loadImageFile(item.file);
        let targetW: number;
        let targetH: number;
        if (mode === "pixels") {
          targetW = parseInt(width, 10);
          targetH = parseInt(height, 10);
        } else {
          const p = parseFloat(percent) || 100;
          targetW = Math.round((image.width * p) / 100);
          targetH = Math.round((image.height * p) / 100);
        }
        if (!targetW || !targetH || targetW < 1 || targetH < 1) throw new Error("Enter valid target dimensions.");
        if (targetW > 12000 || targetH > 12000) throw new Error("Maximum output dimension is 12000px.");

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image.bitmap as CanvasImageSource, 0, 0, targetW, targetH);

        let target: OutputFormat = format === "auto" ? (item.type === "png" ? "png" : item.type === "webp" ? "webp" : "jpeg") : (format as OutputFormat);
        if (target === "gif" || target === "bmp") target = "png";
        const blob = await canvasToBlob(canvas, target, 0.92);
        outputs.push({ name: `${stripExtension(item.file.name)}-${targetW}x${targetH}.${target === "jpeg" ? "jpg" : target}`, blob });
      }

      if (outputs.length === 1) {
        return { filename: outputs[0].name, blob: outputs[0].blob, originalSize: files[0].file.size };
      }
      return {
        result: { filename: outputs[0].name, blob: outputs[0].blob },
        additional: outputs.slice(1),
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setFirstDims(null);
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="image/*" multiple label="Drop images here to resize" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files.length > 0 && (
            <>
              <div className="space-y-2">
                {files.map((f) => (
                  <FileListRow key={f.id} item={f} onRemove={() => removeFile(f.id)} />
                ))}
              </div>
              <div className="space-y-4 rounded-xl border bg-card p-4">
                <OptionSelect
                  label="Resize by"
                  value={mode}
                  onValueChange={setMode}
                  id="ir-mode"
                  options={[
                    { value: "pixels", label: "Exact pixels" },
                    { value: "percent", label: "Percentage" },
                  ]}
                />
                {mode === "pixels" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <OptionInput label="Width (px)" type="number" value={width} onValueChange={onWidthChange} min={1} id="ir-w" />
                      <OptionInput label="Height (px)" type="number" value={height} onValueChange={onHeightChange} min={1} id="ir-h" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setLockRatio((v) => !v)}
                      aria-pressed={lockRatio}
                      className="focus-ring inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      {lockRatio ? <Lock size={13} /> : <LockOpen size={13} />}
                      {lockRatio ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                      {firstDims ? ` (${firstDims.w}×${firstDims.h})` : ""}
                    </button>
                  </>
                ) : (
                  <OptionInput label="Scale (%)" type="number" value={percent} onValueChange={setPercent} placeholder="50" min={1} max={1000} id="ir-pct" />
                )}
                <OptionSelect
                  label="Output format"
                  value={format}
                  onValueChange={setFormat}
                  id="ir-format"
                  options={[
                    { value: "auto", label: "Same as input" },
                    { value: "png", label: "PNG" },
                    { value: "jpeg", label: "JPG" },
                    { value: "webp", label: "WEBP" },
                  ]}
                />
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Resize {files.length} Image{files.length === 1 ? "" : "s"}
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Resizing images…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} additionalResults={wf.additional} onReset={reset} zipName="resized-images.zip" />}
    </div>
  );
}
