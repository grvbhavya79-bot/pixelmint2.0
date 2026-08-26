"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSelect } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadImageFile, canvasToBlob, type OutputFormat } from "@/lib/imaging";
import { clamp, stripExtension } from "@/lib/format";

const RATIOS: { value: string; label: string; ratio: number | null }[] = [
  { value: "free", label: "Free crop", ratio: null },
  { value: "1:1", label: "Square 1:1", ratio: 1 },
  { value: "4:3", label: "4:3", ratio: 4 / 3 },
  { value: "3:4", label: "3:4 portrait", ratio: 3 / 4 },
  { value: "16:9", label: "16:9 wide", ratio: 16 / 9 },
  { value: "9:16", label: "9:16 story", ratio: 9 / 16 },
  { value: "3:2", label: "3:2 photo", ratio: 3 / 2 },
  { value: "custom", label: "Custom ratio", ratio: null },
];

export default function ImageCropTool() {
  const queue = useFileQueue(ACCEPT.images, { multiple: false, images: true });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("image-cropper");
  const [ratioKey, setRatioKey] = useState("free");
  const [customRatio, setCustomRatio] = useState("1.5");
  const [format, setFormat] = useState("auto");
  const [image, setImage] = useState<{ url: string; w: number; h: number } | null>(null);
  const [crop, setCrop] = useState({ x: 10, y: 10, w: 60, h: 60 }); // percentages
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ mode: string; startX: number; startY: number; orig: typeof crop } | null>(null);

  const getRatio = useCallback((): number | null => {
    if (ratioKey === "free") return null;
    if (ratioKey === "custom") {
      const v = parseFloat(customRatio);
      return v > 0 ? v : null;
    }
    return RATIOS.find((r) => r.value === ratioKey)?.ratio ?? null;
  }, [ratioKey, customRatio]);

  useEffect(() => {
    if (files[0]) {
      void loadImageFile(files[0].file).then((img) => {
        setImage({ url: files[0].previewUrl ?? "", w: img.width, h: img.height });
        const initialRatio = getRatio();
        if (initialRatio) {
          let cw = 70;
          let ch = (cw * (img.width / img.height)) / initialRatio;
          if (ch > 70) {
            ch = 70;
            cw = (ch * initialRatio) / (img.width / img.height);
          }
          setCrop({ x: 15, y: 15, w: cw, h: ch });
        } else {
          setCrop({ x: 10, y: 10, w: 60, h: 60 });
        }
      });
    }
  }, [files[0]?.id]);

  const onPointerDown = (e: React.PointerEvent, mode: string) => {
    e.stopPropagation();
    const parent = containerRef.current!.getBoundingClientRect();
    dragState.current = {
      mode,
      startX: ((e.clientX - parent.left) / parent.width) * 100,
      startY: ((e.clientY - parent.top) / parent.height) * 100,
      orig: { ...crop },
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current || !containerRef.current) return;
    const parent = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - parent.left) / parent.width) * 100;
    const y = ((e.clientY - parent.top) / parent.height) * 100;
    const dx = x - dragState.current.startX;
    const dy = y - dragState.current.startY;
    const { mode, orig } = dragState.current;
    const ratio = getRatio();

    if (mode === "move") {
      setCrop((c) => ({
        ...c,
        x: clamp(orig.x + dx, 0, 100 - c.w),
        y: clamp(orig.y + dy, 0, 100 - c.h),
      }));
    } else {
      let w = orig.w;
      let h = orig.h;
      let nx = orig.x;
      let ny = orig.y;
      if (mode.includes("e")) w = clamp(orig.w + dx, 2, 100 - orig.x);
      if (mode.includes("s")) h = clamp(orig.h + dy, 2, 100 - orig.y);
      if (mode.includes("w")) {
        nx = clamp(orig.x + dx, 0, orig.x + orig.w - 2);
        w = orig.w + (orig.x - nx);
      }
      if (mode.includes("n")) {
        ny = clamp(orig.y + dy, 0, orig.y + orig.h - 2);
        h = orig.h + (orig.y - ny);
      }
      if (ratio && image) {
        // keep pixel-accurate ratio: (w% * W) / (h% * H) = ratio
        const imgRatio = image.w / image.h;
        if (mode.includes("e") || mode.includes("w")) {
          h = clamp((w * imgRatio) / ratio, 2, 100);
        } else {
          w = clamp((h * ratio) / imgRatio, 2, 100);
        }
      }
      const fx = nx;
      const fy = ny;
      const fw = w;
      const fh = h;
      setCrop(() => ({ x: fx, y: fy, w: fw, h: fh }));
    }
  };

  const run = async () => {
    if (!files[0] || !image) return;
    await wf.run(async () => {
      const img = await loadImageFile(files[0].file);
      const sx = (crop.x / 100) * img.width;
      const sy = (crop.y / 100) * img.height;
      const sw = (crop.w / 100) * img.width;
      const sh = (crop.h / 100) * img.height;
      if (sw < 2 || sh < 2) throw new Error("The crop area is too small — drag it larger.");

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(sw);
      canvas.height = Math.round(sh);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img.bitmap as CanvasImageSource, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      let target: OutputFormat = format === "auto" ? (files[0].type === "png" ? "png" : "jpeg") : (format as OutputFormat);
      if (target === "gif" || target === "bmp") target = "png";
      const blob = await canvasToBlob(canvas, target, 0.92);
      return {
        filename: `${stripExtension(files[0].file.name)}-cropped.${target === "jpeg" ? "jpg" : target}`,
        blob,
        originalSize: files[0].file.size,
        extra: <p className="mt-3 text-xs text-muted-foreground">Cropped to {canvas.width} × {canvas.height} px.</p>,
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setImage(null);
  };

  const handles = ["nw", "ne", "sw", "se", "n", "s", "e", "w"];
  const cursorMap: Record<string, string> = {
    nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize",
    n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="image/*" label="Drop an image here to crop" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && image && (
            <>
              <FileListRow item={files[0]} onRemove={() => { removeFile(files[0].id); setImage(null); }} />
              <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3">
                <OptionSelect label="Crop ratio" value={ratioKey} onValueChange={setRatioKey} options={RATIOS.map(({ value, label }) => ({ value, label }))} id="crop-ratio" />
                {ratioKey === "custom" && (
                  <OptionSelect
                    label="Custom ratio (w:h)"
                    value={customRatio}
                    onValueChange={setCustomRatio}
                    options={[
                      { value: "1.5", label: "1.5 : 1" },
                      { value: "1.777", label: "16 : 9" },
                      { value: "0.8", label: "4 : 5" },
                      { value: "0.5625", label: "9 : 16" },
                    ]}
                    id="crop-custom"
                  />
                )}
                <OptionSelect
                  label="Output format"
                  value={format}
                  onValueChange={setFormat}
                  options={[
                    { value: "auto", label: "Same as input" },
                    { value: "png", label: "PNG" },
                    { value: "jpeg", label: "JPG" },
                    { value: "webp", label: "WEBP" },
                  ]}
                  id="crop-format"
                />
              </div>
              <div className="space-y-2">
                <div
                  ref={containerRef}
                  className="relative mx-auto w-full max-w-lg touch-none select-none overflow-hidden rounded-lg border bg-checker"
                  style={{ aspectRatio: `${image.w}/${image.h}`, backgroundImage: "conic-gradient(#e2e8f0 25%, transparent 0 50%, #e2e8f0 0 75%, transparent 0)", backgroundSize: "20px 20px" }}
                  onPointerMove={onPointerMove}
                  onPointerUp={() => (dragState.current = null)}
                >
                  { }
                  <img src={image.url} alt="Image to crop" className="pointer-events-none absolute inset-0 h-full w-full object-contain" draggable={false} />
                  <div
                    role="region"
                    aria-label="Crop area — drag to move, use corners to resize"
                    tabIndex={0}
                    className="absolute cursor-move border-2 border-primary bg-primary/10"
                    style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.w}%`, height: `${crop.h}%` }}
                    onPointerDown={(e) => onPointerDown(e, "move")}
                  >
                    {handles.map((h) => (
                      <span
                        key={h}
                        onPointerDown={(e) => onPointerDown(e, h)}
                        aria-hidden="true"
                        className="absolute h-3.5 w-3.5 rounded-sm border-2 border-primary bg-white"
                        style={{
                          cursor: cursorMap[h],
                          left: h.includes("w") ? -7 : h.includes("e") ? "calc(100% - 7px)" : "calc(50% - 3.5px)",
                          top: h.includes("n") ? -7 : h.includes("s") ? "calc(100% - 7px)" : "calc(50% - 3.5px)",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Crop area: {Math.round((crop.w / 100) * image.w)} × {Math.round((crop.h / 100) * image.h)} px
                </p>
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Crop Image
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Cropping image…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
