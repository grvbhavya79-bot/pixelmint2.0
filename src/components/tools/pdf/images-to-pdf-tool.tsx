"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PDFDocument } from "@cantoo/pdf-lib";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSelect, OptionSwitch } from "@/components/tools/shared/option-controls";
import { loadImageFile } from "@/lib/imaging";
import { ACCEPT } from "@/lib/file-validate";
import type { SniffedType } from "@/lib/file-validate";

interface Props {
  /** Accepted sniffed types */
  accept?: SniffedType[];
  preset?: string;
}

const PAGE_PRESETS: Record<string, [number, number]> = {
  fit: [0, 0], // computed per image
  a4: [595.28, 841.89],
  a4l: [841.89, 595.28],
  letter: [612, 792],
};

export default function ImagesToPdfTool({ accept = ["png", "jpeg", "webp", "bmp"] }: Props) {
  const queue = useFileQueue({ accept, maxSize: 50 * 1024 * 1024 }, { multiple: true, images: true });
  const { files, addFiles, removeFile, moveFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("images-to-pdf");
  const [pageSize, setPageSize] = useState("fit");
  const [margin, setMargin] = useState("24");
  const [mergeIntoOne, setMergeIntoOne] = useState(true);

  const mimeAccept = accept.includes("pdf") ? "application/pdf" : "image/*";

  const buildPage = async (doc: PDFDocument, imgBytes: Uint8Array, isPng: boolean, name: string, index: number) => {
    const embedded = await doc.embedPng(imgBytes);
    const [pw, ph] = PAGE_PRESETS[pageSize] ?? [0, 0];
    const m = parseInt(margin, 10) || 0;

    if (pw === 0) {
      // Fit page to image
      const w = embedded.width + m * 2;
      const h = embedded.height + m * 2;
      const page = doc.addPage([w, h]);
      page.drawImage(embedded, { x: m, y: m, width: embedded.width, height: embedded.height });
    } else {
      const page = doc.addPage([pw, ph]);
      const scale = Math.min((pw - m * 2) / embedded.width, (ph - m * 2) / embedded.height);
      const w = embedded.width * scale;
      const h = embedded.height * scale;
      page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    }
    void name;
    void index;
  };

  const run = async () => {
    if (files.length === 0) return;
    await wf.run(async () => {
      // Convert every input to PNG (canvas handles all decode), embed as PNG
      const doc = await PDFDocument.create();
      doc.setProducer("ToolBox100");

      for (const item of files) {
        const image = await loadImageFile(item.file);
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(image.bitmap as CanvasImageSource, 0, 0);
        const pngBlob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Image conversion failed"))), "image/png"),
        );
        const bytes = new Uint8Array(await pngBlob.arrayBuffer());
        await buildPage(doc, bytes, true, item.file.name, 0);
      }

      const bytes = await doc.save({ useObjectStreams: true });
      return {
        filename: `${files.length === 1 ? files[0].file.name.replace(/\.[^.]+$/, "") : "images"}-converted.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: files.reduce((s, f) => s + f.file.size, 0),
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
          <FileDropzone
            onFiles={(fs) => void addFiles(fs)}
            accept={`${mimeAccept},.png,.jpg,.jpeg,.webp,.bmp`}
            multiple
            label="Drop images here"
            hint={`Accepts ${accept.map((a) => a.toUpperCase()).join(", ")} · each image becomes one page`}
            disabled={wf.busy}
          />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files.length > 0 && (
            <>
              <div className="space-y-2">
                {files.map((f, i) => (
                  <FileListRow
                    key={f.id}
                    item={f}
                    onRemove={() => removeFile(f.id)}
                    onMoveUp={i > 0 ? () => moveFile(f.id, -1) : undefined}
                    onMoveDown={i < files.length - 1 ? () => moveFile(f.id, 1) : undefined}
                  />
                ))}
              </div>
              <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
                <OptionSelect
                  label="Page size"
                  value={pageSize}
                  onValueChange={setPageSize}
                  id="i2p-size"
                  options={[
                    { value: "fit", label: "Fit to each image" },
                    { value: "a4", label: "A4 portrait" },
                    { value: "a4l", label: "A4 landscape" },
                    { value: "letter", label: "US Letter" },
                  ]}
                />
                <OptionSelect
                  label="Margin"
                  value={margin}
                  onValueChange={setMargin}
                  id="i2p-margin"
                  options={[
                    { value: "0", label: "No margin" },
                    { value: "24", label: "Small margin" },
                    { value: "48", label: "Large margin" },
                  ]}
                />
              </div>
              <OptionSwitch
                label="Combine into one PDF"
                checked={mergeIntoOne}
                onCheckedChange={setMergeIntoOne}
                hint="Off = each image becomes its own PDF file"
                id="i2p-merge"
              />
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Convert to PDF ({files.length} {files.length === 1 ? "image" : "images"})
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Building PDF…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
