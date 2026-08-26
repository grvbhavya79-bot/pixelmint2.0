"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SquareDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSlider } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadImageFile, canvasToBlob, sharpenCanvas } from "@/lib/imaging";
import { stripExtension } from "@/lib/format";

export default function ImageBlurSharpenTool({ mode = "blur" }: { mode?: string }) {
  const isBlur = mode === "blur";
  const queue = useFileQueue(ACCEPT.images, { multiple: false, images: true });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow(isBlur ? "image-blur" : "image-sharpen");
  const [strength, setStrength] = useState(isBlur ? 8 : 80);
  const [radius, setRadius] = useState(isBlur ? 6 : 1);
  const [areaSelect, setAreaSelect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [image, setImage] = useState<{ url: string; w: number; h: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);

  useEffect(() => {
    if (files[0]) {
      void loadImageFile(files[0].file).then((img) => {
        setImage({ url: files[0].previewUrl ?? "", w: img.width, h: img.height });
        setAreaSelect(null);
        setPreviewUrl(null);
      });
    }
     
  }, [files[0]?.id]);

  const renderPreview = async () => {
    if (!image || !files[0] || !previewCanvasRef.current) return;
    const img = await loadImageFile(files[0].file);
    const canvas = previewCanvasRef.current;
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img.bitmap as CanvasImageSource, 0, 0);

    if (isBlur) {
      if (areaSelect) {
        // blur selected region only: draw blurred copy clipped to rect
        const blurCanvas = document.createElement("canvas");
        blurCanvas.width = canvas.width;
        blurCanvas.height = canvas.height;
        const bctx = blurCanvas.getContext("2d")!;
        bctx.filter = `blur(${Math.max(0.5, strength / 10)}px)`;
        bctx.drawImage(canvas, 0, 0);
        const sx = (areaSelect.x / 100) * canvas.width;
        const sy = (areaSelect.y / 100) * canvas.height;
        const sw = (areaSelect.w / 100) * canvas.width;
        const sh = (areaSelect.h / 100) * canvas.height;
        ctx.drawImage(blurCanvas, sx, sy, sw, sh, sx, sy, sw, sh);
      } else {
        ctx.filter = `blur(${Math.max(0.5, strength / 10)}px)`;
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = "none";
      }
    } else {
      sharpenCanvas(canvas, strength, radius);
    }
    setPreviewUrl(canvas.toDataURL(files[0].type === "png" ? "image/png" : "image/jpeg", 0.9));
  };

  // Debounced live preview whenever the image or settings change
  useEffect(() => {
    if (!image || !files[0]) return;
    const t = setTimeout(() => {
      void renderPreview();
    }, 120);
    return () => clearTimeout(t);
  }, [image, strength, radius, areaSelect]);

  const onPointerDown = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = { startX: e.clientX - rect.left, startY: e.clientY - rect.top };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const x0 = Math.min(dragRef.current.startX, x);
    const y0 = Math.min(dragRef.current.startY, y);
    const w = Math.abs(x - dragRef.current.startX);
    const h = Math.abs(y - dragRef.current.startY);
    setAreaSelect({ x: (x0 / rect.width) * 100, y: (y0 / rect.height) * 100, w: (w / rect.width) * 100, h: (h / rect.height) * 100 });
  };

  const run = async () => {
    if (!files[0] || !previewCanvasRef.current) return;
    await wf.run(async () => {
      const target = files[0].type === "png" ? "png" : "jpeg";
      const blob = await canvasToBlob(previewCanvasRef.current!, target, 0.92);
      return {
        filename: `${stripExtension(files[0].file.name)}-${isBlur ? "blurred" : "sharpened"}.${target === "jpeg" ? "jpg" : "png"}`,
        blob,
        originalSize: files[0].file.size,
        extra: isBlur && areaSelect
          ? <p className="mt-3 text-xs text-muted-foreground">Blurred the selected area only — ideal for hiding sensitive details.</p>
          : undefined,
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setImage(null);
    setPreviewUrl(null);
    setAreaSelect(null);
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="image/*" label={isBlur ? "Drop an image to blur" : "Drop an image to sharpen"} disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && image && (
            <>
              <FileListRow item={files[0]} onRemove={() => { removeFile(files[0].id); setImage(null); }} />
              <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
                <OptionSlider label={isBlur ? "Blur strength" : "Sharpen amount"} value={strength} onValueChange={setStrength} min={isBlur ? 2 : 10} max={isBlur ? 40 : 200} />
                <OptionSlider label={isBlur ? "Blur radius" : "Sharpen radius"} value={radius} onValueChange={setRadius} min={isBlur ? 2 : 1} max={isBlur ? 20 : 4} unit=" px" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-center text-xs font-medium text-muted-foreground">
                    {isBlur ? "Drag on the image to blur only that area (optional)" : "Original"}
                  </p>
                  <div
                    className="relative touch-none overflow-hidden rounded-lg border"
                    onPointerDown={isBlur ? onPointerDown : undefined}
                    onPointerMove={isBlur ? onPointerMove : undefined}
                    onPointerUp={() => (dragRef.current = null)}
                  >
                    { }
                    <img src={image.url} alt="Original" className="h-56 w-full object-contain" draggable={false} />
                    {areaSelect && (
                      <div className="pointer-events-none absolute border-2 border-primary bg-primary/20" style={{ left: `${areaSelect.x}%`, top: `${areaSelect.y}%`, width: `${areaSelect.w}%`, height: `${areaSelect.h}%` }} />
                    )}
                  </div>
                  {areaSelect && (
                    <Button variant="ghost" size="sm" onClick={() => setAreaSelect(null)}>
                      <SquareDashed size={13} className="mr-1" /> Blur whole image instead
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-center text-xs font-medium text-muted-foreground">Live preview</p>
                  <div className="overflow-hidden rounded-lg border">
                    {previewUrl ? (
                       
                      <img src={previewUrl} alt="Preview" className="h-56 w-full object-contain" />
                    ) : (
                      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">Rendering preview…</div>
                    )}
                  </div>
                </div>
              </div>
              <canvas ref={previewCanvasRef} className="hidden" aria-hidden="true" />
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy || !previewUrl} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                {isBlur ? "Apply Blur" : "Apply Sharpen"}
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Applying filter…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
