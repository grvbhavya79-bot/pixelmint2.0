"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSlider } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadImageFile, canvasToBlob, applyCssFilter } from "@/lib/imaging";
import { stripExtension } from "@/lib/format";

interface Filters {
  brightness: number;
  contrast: number;
  saturate: number;
  blur: number;
  sepia: number;
  invert: number;
  grayscale: number;
}

const DEFAULTS: Filters = { brightness: 100, contrast: 100, saturate: 100, blur: 0, sepia: 0, invert: 0, grayscale: 0 };
const GRAYSCALE: Filters = { ...DEFAULTS, grayscale: 100 };

export default function ImageFiltersTool({ preset = "none" }: { preset?: string }) {
  const isGrayscalePreset = preset === "grayscale";
  const queue = useFileQueue(ACCEPT.images, { multiple: false, images: true });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow(isGrayscalePreset ? "image-grayscale" : "image-filters");
  const [filters, setFilters] = useState<Filters>(isGrayscalePreset ? GRAYSCALE : DEFAULTS);
  const [image, setImage] = useState<{ url: string; w: number; h: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (files[0]) {
      void loadImageFile(files[0].file).then((img) => {
        setImage({ url: files[0].previewUrl ?? "", w: img.width, h: img.height });
      });
    }
     
  }, [files[0]?.id]);

  useEffect(() => {
    if (!image || !files[0]) return;
    const t = setTimeout(async () => {
      const img = await loadImageFile(files[0].file);
      const canvas = applyCssFilter(img, {
        brightness: filters.brightness,
        contrast: filters.contrast,
        saturate: filters.saturate,
        blur: filters.blur,
        sepia: filters.sepia,
        invert: filters.invert,
        grayscale: filters.grayscale,
      });
      setPreviewUrl(canvas.toDataURL(files[0].type === "png" ? "image/png" : "image/jpeg", 0.9));
    }, 100);
    return () => clearTimeout(t);
     
  }, [image, filters]);

  const set = (key: keyof Filters) => (v: number) => setFilters((f) => ({ ...f, [key]: v }));

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const img = await loadImageFile(files[0].file);
      const canvas = applyCssFilter(img, { ...filters });
      const target = files[0].type === "png" ? "png" : "jpeg";
      const blob = await canvasToBlob(canvas, target, 0.92);
      return {
        filename: `${stripExtension(files[0].file.name)}-${isGrayscalePreset ? "grayscale" : "filtered"}.${target === "jpeg" ? "jpg" : "png"}`,
        blob,
        originalSize: files[0].file.size,
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setImage(null);
    setPreviewUrl(null);
    setFilters(isGrayscalePreset ? GRAYSCALE : DEFAULTS);
  };

  const filterControls: { key: keyof Filters; label: string; min: number; max: number; unit: string }[] = [
    { key: "brightness", label: "Brightness", min: 0, max: 200, unit: "%" },
    { key: "contrast", label: "Contrast", min: 0, max: 200, unit: "%" },
    { key: "saturate", label: "Saturation", min: 0, max: 200, unit: "%" },
    { key: "blur", label: "Blur", min: 0, max: 20, unit: "px" },
    { key: "sepia", label: "Sepia", min: 0, max: 100, unit: "%" },
    { key: "invert", label: "Invert", min: 0, max: 100, unit: "%" },
  ];

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="image/*" label={isGrayscalePreset ? "Drop an image to convert to black & white" : "Drop an image to adjust filters"} disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && image && (
            <>
              <FileListRow item={files[0]} onRemove={() => { removeFile(files[0].id); setImage(null); }} />
              {isGrayscalePreset ? (
                <div className="rounded-xl border bg-card p-4">
                  <OptionSlider label="Grayscale depth" value={filters.grayscale} onValueChange={set("grayscale")} min={0} max={100} unit="%" hint="100% is fully black & white." />
                </div>
              ) : (
                <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
                  {filterControls.map((c) => (
                    <OptionSlider key={c.key} label={c.label} value={filters[c.key]} onValueChange={set(c.key)} min={c.min} max={c.max} unit={c.unit} />
                  ))}
                  <div className="sm:col-span-2">
                    <Button variant="outline" size="sm" onClick={() => setFilters(DEFAULTS)}>
                      <RotateCcw size={13} className="mr-1.5" /> Reset all filters
                    </Button>
                  </div>
                </div>
              )}
              {previewUrl && (
                <div className="overflow-hidden rounded-lg border">
                  { }
                  <img src={previewUrl} alt="Filter preview" className="mx-auto max-h-80 w-auto object-contain" />
                </div>
              )}
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy || !previewUrl} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                {isGrayscalePreset ? "Convert to Grayscale" : "Apply Filters"}
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Applying adjustments…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
