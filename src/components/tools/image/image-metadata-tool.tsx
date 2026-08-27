"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { ACCEPT } from "@/lib/file-validate";
import { loadImageFile, canvasToBlob } from "@/lib/imaging";
import { readExif, type ExifEntry } from "@/lib/exif";
import { formatBytes, stripExtension } from "@/lib/format";

export default function ImageMetadataTool({ mode = "view" }: { mode?: string }) {
  const isView = mode === "view";
  const queue = useFileQueue(ACCEPT.images, { multiple: false, images: true });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow(isView ? "image-metadata-viewer" : "image-metadata-remover");
  const [meta, setMeta] = useState<{
    dimensions: string;
    type: string;
    size: string;
    exif: ExifEntry[];
  } | null>(null);

  useEffect(() => {
    if (!files[0] || !isView) return;
    void (async () => {
      const buffer = await files[0].file.arrayBuffer();
      const img = await loadImageFile(files[0].file);
      setMeta({
        dimensions: `${img.width} × ${img.height} px`,
        type: files[0].type.toUpperCase(),
        size: formatBytes(files[0].file.size),
        exif: files[0].type === "jpeg" ? readExif(buffer) : [],
      });
    })();
     
  }, [files[0]?.id]);

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      // Removing metadata = re-encode pixels only into a fresh file
      const img = await loadImageFile(files[0].file);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img.bitmap as CanvasImageSource, 0, 0);
      const target = files[0].type === "png" ? "png" : files[0].type === "webp" ? "webp" : "jpeg";
      const blob = await canvasToBlob(canvas, target, 0.95);
      return {
        filename: `${stripExtension(files[0].file.name)}-clean.${target === "jpeg" ? "jpg" : target}`,
        blob,
        originalSize: files[0].file.size,
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            Re-encoded from raw pixels — camera info, GPS and software tags are gone. Visual quality is preserved.
          </p>
        ),
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setMeta(null);
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="image/*" label={isView ? "Drop an image to inspect its metadata" : "Drop an image to strip its metadata"} disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => { removeFile(files[0].id); setMeta(null); }} />
              {isView && meta && (
                <div className="overflow-hidden rounded-xl border bg-card">
                  <dl className="divide-y">
                    {[
                      ["File name", files[0].file.name],
                      ["Format", meta.type],
                      ["File size", meta.size],
                      ["Dimensions", meta.dimensions],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                        <dt className="text-sm text-muted-foreground">{label}</dt>
                        <dd className="truncate text-sm font-medium text-foreground">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="border-t px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">EXIF data</p>
                    {files[0].type !== "jpeg" && meta.exif.length === 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        EXIF is a JPEG feature — this format doesn&apos;t carry EXIF metadata.
                      </p>
                    ) : meta.exif.length === 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">No EXIF metadata found in this image.</p>
                    ) : (
                      <dl className="mt-2 max-h-72 space-y-1.5 overflow-y-auto scrollbar-thin">
                        {meta.exif.map((entry) => (
                          <div key={entry.label + entry.tag} className="flex items-start justify-between gap-4 rounded-lg bg-muted/50 px-3 py-1.5">
                            <dt className="text-xs text-muted-foreground">{entry.label}</dt>
                            <dd className="max-w-[60%] break-words text-right text-xs font-medium text-foreground">{entry.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </div>
              )}
              {!isView && (
                <div className="rounded-xl border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
                  <p className="font-medium text-foreground">What gets removed?</p>
                  <p className="mt-1">
                    Camera make &amp; model, GPS coordinates, timestamps, software/editing history and unique IDs —
                    everything except the visible pixels. Share photos without leaking where or how they were taken.
                  </p>
                </div>
              )}
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                {isView ? "Download Metadata Report" : "Remove Metadata"}
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel={isView ? "Generating report…" : "Stripping metadata…"} />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
