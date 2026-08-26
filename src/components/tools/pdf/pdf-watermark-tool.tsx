"use client";

import { useState } from "react";
import { degrees, rgb, StandardFonts } from "@cantoo/pdf-lib";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionInput, OptionSelect, OptionSlider, SegmentedControl } from "@/components/tools/shared/option-controls";
import { ACCEPT, LIMITS, validateFile } from "@/lib/file-validate";
import { loadPdfLib } from "@/lib/pdf/client";
import { loadImageFile } from "@/lib/imaging";
import { sanitizeWinAnsi, stripExtension } from "@/lib/format";
import { Upload } from "lucide-react";

const POSITIONS = [
  { value: "tl", label: "Top left" },
  { value: "tc", label: "Top center" },
  { value: "tr", label: "Top right" },
  { value: "ml", label: "Middle left" },
  { value: "mc", label: "Center" },
  { value: "mr", label: "Middle right" },
  { value: "bl", label: "Bottom left" },
  { value: "bc", label: "Bottom center" },
  { value: "br", label: "Bottom right" },
];

function computePosition(
  pos: string,
  pageW: number,
  pageH: number,
  contentW: number,
  contentH: number,
  margin: number,
): { x: number; y: number } {
  const [vertical, horizontal] = [pos[0], pos[1]];
  const x =
    horizontal === "l" ? margin
    : horizontal === "c" ? (pageW - contentW) / 2
    : pageW - contentW - margin;
  const y =
    vertical === "t" ? pageH - contentH - margin
    : vertical === "m" ? (pageH - contentH) / 2
    : margin;
  return { x, y };
}

export default function PdfWatermarkTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("pdf-watermark");
  const [kind, setKind] = useState<"text" | "image">("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(30);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState("#2563EB");
  const [position, setPosition] = useState("mc");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageScale, setImageScale] = useState(40);

  const hexToRgb = (hex: string): [number, number, number] => {
    const m = hex.replace("#", "");
    const num = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
    return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
  };

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const doc = await loadPdfLib(await files[0].file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.HelveticaBold);

      let watermarkImage: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
      if (kind === "image") {
        if (!imageFile) throw new Error("Upload a watermark image (PNG recommended).");
        const check = await validateFile(imageFile, { accept: ["png", "jpeg"], maxSize: LIMITS.image });
        if (!check.ok) throw new Error(check.error ?? "Invalid watermark image.");
        const img = await loadImageFile(imageFile);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d")!.drawImage(img.bitmap as CanvasImageSource, 0, 0);
        const pngBlob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Image processing failed"))), "image/png"),
        );
        watermarkImage = await doc.embedPng(new Uint8Array(await pngBlob.arrayBuffer()));
      } else if (!text.trim()) {
        throw new Error("Enter the watermark text.");
      }

      const pages = doc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        if (kind === "text") {
          const clean = sanitizeWinAnsi(text);
          const textWidth = font.widthOfTextAtSize(clean, fontSize);
          const { x, y } = computePosition(position, width, height, textWidth, fontSize, 36);
          const [r, g, b] = hexToRgb(color);
          page.drawText(clean, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(r, g, b),
            opacity: opacity / 100,
            rotate: degrees(rotation),
          });
        } else if (watermarkImage) {
          const scale = imageScale / 100;
          const w = width * scale;
          const h = (watermarkImage.height / watermarkImage.width) * w;
          const { x, y } = computePosition(position, width, height, w, h, 24);
          page.drawImage(watermarkImage, {
            x,
            y,
            width: w,
            height: h,
            opacity: opacity / 100,
            rotate: degrees(rotation),
          });
        }
      }

      const bytes = await doc.save({ useObjectStreams: true });
      return {
        filename: `${stripExtension(files[0].file.name)}-watermarked.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: files[0].file.size,
        extra: <p className="mt-3 text-xs text-muted-foreground">Watermark applied to all {pages.length} pages.</p>,
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setImageFile(null);
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="application/pdf,.pdf" label="Drop a PDF here to watermark" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <div className="space-y-4 rounded-xl border bg-card p-4">
                <SegmentedControl
                  ariaLabel="Watermark type"
                  value={kind}
                  onValueChange={setKind}
                  options={[
                    { value: "text", label: "Text watermark" },
                    { value: "image", label: "Image watermark" },
                  ]}
                />
                {kind === "text" ? (
                  <>
                    <OptionInput label="Watermark text" value={text} onValueChange={setText} placeholder="e.g. CONFIDENTIAL" id="wm-text" />
                    <div className="flex items-end gap-4">
                      <OptionInput label="Color" type="color" value={color} onValueChange={setColor} id="wm-color" className="h-10 w-20 cursor-pointer p-1" />
                    </div>
                    <OptionSlider label="Font size" value={fontSize} onValueChange={setFontSize} min={12} max={144} unit=" pt" />
                  </>
                ) : (
                  <>
                    <div>
                      <p className="mb-1.5 text-[13px] font-medium">Watermark image (PNG with transparency works best)</p>
                      {imageFile ? (
                        <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                          <span className="truncate text-sm">{imageFile.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => setImageFile(null)}>Remove</Button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-4 text-sm text-muted-foreground hover:border-primary/50">
                          <Upload size={15} /> Upload image
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            className="sr-only"
                            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                          />
                        </label>
                      )}
                    </div>
                    <OptionSlider label="Image size" value={imageScale} onValueChange={setImageScale} min={5} max={100} unit="%" />
                  </>
                )}
                <OptionSelect label="Position" value={position} onValueChange={setPosition} options={POSITIONS} id="wm-pos" />
                <OptionSlider label="Opacity" value={opacity} onValueChange={setOpacity} min={5} max={100} unit="%" />
                <OptionSlider label="Rotation" value={rotation} onValueChange={setRotation} min={0} max={360} unit="°" />
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Add Watermark
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Applying watermark…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
