"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSlider, OptionSwitch } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadImageFile } from "@/lib/imaging";
import { clamp } from "@/lib/format";


/**
 * Real background removal:
 * - flood-fill from the image borders with colour tolerance (works on plain backdrops)
 * - plus click-to-remove extra colours
 * - optional edge feathering for smoother cut-outs
 */
export default function BgRemoverTool() {
  const queue = useFileQueue(ACCEPT.imagesNoGif, { multiple: false, images: true });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("background-remover");
  const [tolerance, setTolerance] = useState(32);
  const [feather, setFeather] = useState(true);
  const [autoFromEdges, setAutoFromEdges] = useState(true);
  const [pickedColors, setPickedColors] = useState<number[][]>([]);
  const [image, setImage] = useState<{ url: string; w: number; h: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pickMode, setPickMode] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    if (files[0]) {
      void loadImageFile(files[0].file).then((img) => {
        setImage({ url: files[0].previewUrl ?? "", w: img.width, h: img.height });
        setPickedColors([]);
        setPreviewUrl(null);
      });
    }
     
  }, [files[0]?.id]);

  const process = async (colors: number[][], tol: number, doFeather: boolean) => {
    if (!image || !canvasRef.current || processingRef.current) return;
    processingRef.current = true;
    try {
      const img = await loadImageFile(files[0].file);
      const canvas = canvasRef.current;
      canvas.width = Math.min(img.width, 4000);
      canvas.height = Math.round((canvas.width / img.width) * img.height);
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img.bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;
      const tol2 = tol * tol * 3;

      const match = (px: number): boolean => {
        const r = data[px];
        const g = data[px + 1];
        const b = data[px + 2];
        for (const [cr, cg, cb] of colors) {
          const dr = r - cr, dg = g - cg, db = b - cb;
          if (dr * dr + dg * dg + db * db <= tol2) return true;
        }
        return false;
      };

      // BFS flood fill from border pixels
      const visited = new Uint8Array(w * h);
      const stack: number[] = [];
      if (autoFromEdges) {
        for (let x = 0; x < w; x++) {
          stack.push(x); // top
          stack.push((h - 1) * w + x); // bottom
        }
        for (let y = 0; y < h; y++) {
          stack.push(y * w); // left
          stack.push(y * w + w - 1); // right
        }
      }
      const removed = new Uint8Array(w * h);
      while (stack.length) {
        const idx = stack.pop()!;
        if (idx < 0 || idx >= w * h || visited[idx]) continue;
        visited[idx] = 1;
        const px = idx * 4;
        if (!match(px)) continue;
        removed[idx] = 1;
        const x = idx % w;
        const y = (idx / w) | 0;
        if (x > 0) stack.push(idx - 1);
        if (x < w - 1) stack.push(idx + 1);
        if (y > 0) stack.push(idx - w);
        if (y < h - 1) stack.push(idx + w);
      }

      // Direct removal for any picked colors (not just connected regions)
      if (pickedColors.length > 0 || colors.length > 0) {
        for (let i = 0; i < w * h; i++) {
          if (!removed[i] && match(i * 4)) removed[i] = 1;
        }
      }

      // Apply alpha
      for (let i = 0; i < w * h; i++) {
        if (removed[i]) {
          data[i * 4 + 3] = 0;
        }
      }

      if (doFeather) {
        // simple box blur of the alpha channel for smoother edges
        const alphaCopy = new Uint8ClampedArray(w * h);
        for (let i = 0; i < w * h; i++) alphaCopy[i] = data[i * 4 + 3];
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            let sum = 0;
            let count = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                sum += alphaCopy[(y + dy) * w + x + dx];
                count++;
              }
            }
            data[(y * w + x) * 4 + 3] = sum / count;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setPreviewUrl(canvas.toDataURL("image/png"));
    } finally {
      processingRef.current = false;
    }
  };

  useEffect(() => {
    if (image && autoFromEdges) {
      void generateSeedColor().then((seed) => seed && process([seed, ...pickedColors], tolerance, feather));
    }
     
  }, [image, tolerance, feather, autoFromEdges]);

  const generateSeedColor = async (): Promise<number[] | null> => {
    if (!image || !files[0]) return null;
    const img = await loadImageFile(files[0].file);
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = Math.max(1, Math.round((32 / img.width) * img.height));
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img.bitmap as CanvasImageSource, 0, 0, c.width, c.height);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    // median of corner samples
    const samples: number[][] = [];
    const points = [
      [1, 1], [c.width - 2, 1], [1, c.height - 2], [c.width - 2, c.height - 2],
      [Math.floor(c.width / 2), 1], [1, Math.floor(c.height / 2)], [c.width - 2, Math.floor(c.height / 2)],
    ];
    for (const [x, y] of points) {
      const i = (y * c.width + x) * 4;
      samples.push([d[i], d[i + 1], d[i + 2]]);
    }
    const median = [0, 1, 2].map((ch) => {
      const vals = samples.map((s) => s[ch]).sort((a, b) => a - b);
      return vals[Math.floor(vals.length / 2)];
    });
    return median;
  };

  const onImageClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pickMode || !image || !files[0]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp(Math.round(((e.clientX - rect.left) / rect.width) * image.w), 0, image.w - 1);
    const y = clamp(Math.round(((e.clientY - rect.top) / rect.height) * image.h), 0, image.h - 1);
    const img = await loadImageFile(files[0].file);
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    c.getContext("2d")!.drawImage(img.bitmap as CanvasImageSource, 0, 0);
    const d = c.getContext("2d")!.getImageData(x, y, 1, 1).data;
    const color = [d[0], d[1], d[2]];
    const next = [...pickedColors, color];
    setPickedColors(next);
    toast.success(`Colour removed: rgb(${color.join(", ")})`);
    await process([await generateSeedColor(), color, ...pickedColors].filter(Boolean) as number[][], tolerance, feather);
    setPickMode(false);
  };

  const run = async () => {
    if (!files[0] || !canvasRef.current) return;
    await wf.run(async () => {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvasRef.current!.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png"),
      );
      return {
        filename: `${files[0].file.name.replace(/\.[^.]+$/, "")}-transparent.png`,
        blob,
        originalSize: files[0].file.size,
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            Transparent PNG ready. For complex backgrounds, click additional colors with the colour picker and tune tolerance.
          </p>
        ),
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setImage(null);
    setPreviewUrl(null);
    setPickedColors([]);
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="image/png,image/jpeg,image/webp,image/bmp" label="Drop an image to remove its background" hint="Plain, even backgrounds give the cleanest cut-outs" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && image && (
            <>
              <FileListRow item={files[0]} onRemove={() => { removeFile(files[0].id); setImage(null); }} />
              <div className="space-y-3 rounded-xl border bg-card p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <OptionSlider label="Colour tolerance" value={tolerance} onValueChange={setTolerance} min={5} max={90} hint="Higher removes more similar colours" />
                  <div className="space-y-3">
                    <OptionSwitch label="Auto-detect backdrop from edges" checked={autoFromEdges} onCheckedChange={(v) => { setAutoFromEdges(v); }} id="bg-auto" />
                    <OptionSwitch label="Feather edges" checked={feather} onCheckedChange={setFeather} id="bg-feather" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={pickMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPickMode((v) => !v)}
                    className={pickMode ? "bg-primary text-primary-foreground" : ""}
                  >
                    <MousePointerClick size={14} className="mr-1.5" />
                    {pickMode ? "Click the colour on the image…" : "Remove an extra colour"}
                  </Button>
                  {pickedColors.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {pickedColors.map((c, i) => (
                        <span key={i} className="h-5 w-5 rounded-full border shadow-sm" style={{ background: `rgb(${c.join(",")})` }} />
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => setPickedColors([])}>Clear</Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <figure className="space-y-1.5">
                  <figcaption className="text-center text-xs font-medium text-muted-foreground">Original</figcaption>
                  <div
                    className="relative overflow-hidden rounded-lg border bg-checker"
                    style={{ backgroundImage: "conic-gradient(#e2e8f0 25%, transparent 0 50%, #e2e8f0 0 75%, transparent 0)", backgroundSize: "20px 20px" }}
                    onClick={(e) => void onImageClick(e)}
                  >
                    { }
                    <img src={image.url} alt="Original" className={`h-56 w-full object-contain ${pickMode ? "cursor-crosshair" : ""}`} />
                  </div>
                </figure>
                <figure className="space-y-1.5">
                  <figcaption className="text-center text-xs font-medium text-muted-foreground">Preview (transparent areas shown as checker)</figcaption>
                  <div
                    className="overflow-hidden rounded-lg border"
                    style={{ backgroundImage: "conic-gradient(#cbd5e1 25%, #f1f5f9 0 50%, #cbd5e1 0 75%, #f1f5f9 0)", backgroundSize: "20px 20px" }}
                  >
                    {previewUrl ? (
                       
                      <img src={previewUrl} alt="Background removed preview" className="h-56 w-full object-contain" />
                    ) : (
                      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">Processing preview…</div>
                    )}
                  </div>
                </figure>
              </div>
              <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy || !previewUrl} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Download Transparent PNG
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Preparing PNG…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
