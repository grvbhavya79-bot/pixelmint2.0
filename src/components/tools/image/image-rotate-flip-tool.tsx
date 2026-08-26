"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FlipHorizontal2, FlipVertical2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSlider, OptionSelect } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadImageFile, canvasToBlob } from "@/lib/imaging";
import { stripExtension } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ImageRotateFlipTool({ mode = "rotate" }: { mode?: string }) {
  const isRotate = mode === "rotate";
  const queue = useFileQueue(ACCEPT.images, { multiple: false, images: true });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow(isRotate ? "image-rotator" : "image-flipper");
  const [angle, setAngle] = useState(0);
  const [quarter, setQuarter] = useState(0); // 0-3 × 90°
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [bgColor, setBgColor] = useState("#FFFFFF");

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const img = await loadImageFile(files[0].file);
      const totalAngle = isRotate ? angle + quarter * 90 : quarter * 90;
      const radians = (totalAngle * Math.PI) / 180;

      let dw = img.width;
      let dh = img.height;
      if (totalAngle % 360 !== 0) {
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));
        dw = img.width * cos + img.height * sin;
        dh = img.width * sin + img.height * cos;
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(dw);
      canvas.height = Math.round(dh);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img.bitmap as CanvasImageSource, -img.width / 2, -img.height / 2);

      const target = files[0].type === "png" ? "png" : "jpeg";
      const blob = await canvasToBlob(canvas, target, 0.92);
      return {
        filename: `${stripExtension(files[0].file.name)}-${isRotate ? "rotated" : "flipped"}.${target === "jpeg" ? "jpg" : "png"}`,
        blob,
        originalSize: files[0].file.size,
        extra: <p className="mt-3 text-xs text-muted-foreground">{isRotate ? `Rotated by ${totalAngle}°.` : `Flipped ${flipH ? "horizontally" : ""}${flipH && flipV ? " and " : ""}${flipV ? "vertically" : ""}.`}</p>,
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setAngle(0);
    setQuarter(0);
    setFlipH(false);
    setFlipV(false);
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="image/*" label={isRotate ? "Drop an image here to rotate" : "Drop an image here to flip"} disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <div className="space-y-4 rounded-xl border bg-card p-4">
                {isRotate ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setQuarter(q)}
                          aria-pressed={quarter === q}
                          className={cn(
                            "focus-ring rounded-lg border px-3.5 py-2 text-xs font-medium",
                            quarter === q ? "border-primary bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <RotateCw size={13} className="mr-1 inline" /> {q * 90}°
                        </button>
                      ))}
                    </div>
                    <OptionSlider label="Fine angle" value={angle} onValueChange={setAngle} min={-180} max={180} unit="°" hint="Combines with the 90° steps above." />
                    <OptionSelect
                      label="Fill color for exposed corners"
                      value={bgColor}
                      onValueChange={setBgColor}
                      options={[
                        { value: "#FFFFFF", label: "White" },
                        { value: "#000000", label: "Black" },
                        { value: "#00000000", label: "Transparent (PNG only)" },
                      ]}
                      id="rot-bg"
                    />
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { setFlipH((v) => !v); setFlipV(false); }}
                      aria-pressed={flipH}
                      className={cn(
                        "focus-ring inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium",
                        flipH ? "border-primary bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <FlipHorizontal2 size={15} /> Horizontal mirror
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFlipV((v) => !v); setFlipH(false); }}
                      aria-pressed={flipV}
                      className={cn(
                        "focus-ring inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium",
                        flipV ? "border-primary bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <FlipVertical2 size={15} /> Vertical mirror
                    </button>
                  </div>
                )}
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                {isRotate ? "Rotate Image" : "Flip Image"}
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel={isRotate ? "Rotating image…" : "Flipping image…"} />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
