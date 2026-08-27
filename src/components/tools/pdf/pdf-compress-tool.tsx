"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSelect } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfDocument, loadPdfLib, renderPdfPage } from "@/lib/pdf/client";
import { PDFDocument } from "@cantoo/pdf-lib";
import { stripExtension } from "@/lib/format";
import { canvasToBlob } from "@/lib/imaging";

type Level = "low" | "medium" | "high";

export default function PdfCompressTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("compress-pdf");
  const [level, setLevel] = useState<Level>("medium");

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const file = files[0].file;
      const buffer = await file.arrayBuffer();
      const base = stripExtension(file.name);

      if (level === "low") {
        // Lossless structural optimization
        const doc = await loadPdfLib(buffer);
        doc.setTitle(doc.getTitle() ?? "");
        const bytes = await doc.save({ useObjectStreams: true });
        if (bytes.length >= file.size) {
          // already optimal — return re-saved copy, honestly reported
          toast.info("This PDF is already well optimized — savings are minimal.");
        }
        return {
          filename: `${base}-compressed.pdf`,
          blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
          originalSize: file.size,
        };
      }

      // Medium/High: rasterize pages at scale/quality and rebuild
      const settings = level === "medium"
        ? { scale: 1.5, quality: 0.72 }
        : { scale: 1.0, quality: 0.45 };

      const src = await loadPdfDocument(buffer.slice(0));
      const out = await PDFDocument.create();
      out.setProducer("Pixelmint.fun");
      for (let p = 1; p <= src.numPages; p++) {
        const { canvas } = await renderPdfPage(src, p, settings.scale);
        const jpegBlob = await canvasToBlob(canvas, "jpeg", settings.quality);
        const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
        const embedded = await out.embedJpg(jpegBytes);
        const page = out.addPage([embedded.width / settings.scale, embedded.height / settings.scale]);
        page.drawImage(embedded, { x: 0, y: 0, width: embedded.width / settings.scale, height: embedded.height / settings.scale });
      }
      await src.destroy();
      const bytes = await out.save({ useObjectStreams: true });
      if (bytes.length >= file.size) {
        toast.info("Original file was already smaller than the compressed version — try High compression.");
      }
      return {
        filename: `${base}-compressed.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: file.size,
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            Level {level === "medium" ? "Medium" : "High"} re-encodes pages as images (text becomes non-selectable).
          </p>
        ),
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
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="application/pdf,.pdf" label="Drop a PDF here to compress" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <div className="rounded-xl border bg-card p-4">
                <OptionSelect
                  label="Compression level"
                  value={level}
                  onValueChange={setLevel}
                  id="compress-level"
                  options={[
                    { value: "low", label: "Low — lossless structure optimization" },
                    { value: "medium", label: "Medium — pages re-encoded, good quality" },
                    { value: "high", label: "High — smallest size, reduced quality" },
                  ]}
                  hint="Low keeps text selectable. Medium/High convert pages to compressed images — best for scans and image-heavy files."
                />
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Compress PDF
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel={`Compressing (${level} level)…`} />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
