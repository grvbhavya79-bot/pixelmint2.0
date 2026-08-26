"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSelect } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfDocument, renderPdfPage } from "@/lib/pdf/client";
import { canvasToBlob, type OutputFormat } from "@/lib/imaging";
import { stripExtension } from "@/lib/format";

export default function PdfToImageTool({ format = "jpeg" }: { format?: string }) {
  const target = (format === "png" ? "png" : "jpeg") as OutputFormat;
  const ext = target === "png" ? "png" : "jpg";
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow(target === "png" ? "pdf-to-png" : "pdf-to-jpg");
  const [scale, setScale] = useState("2");
  const [pagesMode, setPagesMode] = useState("all");
  const [pageCount, setPageCount] = useState<number | null>(null);

  const onAdd = async (fs: File[]) => {
    await addFiles(fs);
    try {
      const doc = await loadPdfDocument(await fs[0].arrayBuffer());
      setPageCount(doc.numPages);
      await doc.destroy();
    } catch {
      setPageCount(null);
    }
  };

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const doc = await loadPdfDocument(await files[0].file.arrayBuffer());
      const scaleFactor = parseFloat(scale) || 2;
      const indices =
        pagesMode === "first" ? [1] : Array.from({ length: doc.numPages }, (_, i) => i + 1);
      const base = stripExtension(files[0].file.name);

      const outputs: { name: string; blob: Blob }[] = [];
      for (const p of indices) {
        const { canvas } = await renderPdfPage(doc, p, scaleFactor);
        const blob = await canvasToBlob(canvas, target, 0.92);
        outputs.push({ name: `${base}-page-${String(p).padStart(2, "0")}.${ext}`, blob });
      }
      await doc.destroy();

      if (outputs.length === 1) {
        return { filename: outputs[0].name, blob: outputs[0].blob, originalSize: files[0].file.size };
      }
      return {
        result: { filename: outputs[0].name, blob: outputs[0].blob, originalSize: files[0].file.size },
        additional: outputs.slice(1),
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setPageCount(null);
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void onAdd(fs)} accept="application/pdf,.pdf" label={`Drop a PDF here to convert to ${ext.toUpperCase()}`} disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => { removeFile(files[0].id); setPageCount(null); }} />
              {pageCount && <p className="text-xs text-muted-foreground">Loaded: {pageCount} pages</p>}
              <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
                <OptionSelect
                  label="Resolution"
                  value={scale}
                  onValueChange={setScale}
                  id="p2i-scale"
                  options={[
                    { value: "1", label: "1x — screen (72 dpi)" },
                    { value: "2", label: "2x — sharp (144 dpi)" },
                    { value: "3", label: "3x — print quality (216 dpi)" },
                  ]}
                />
                <OptionSelect
                  label="Pages"
                  value={pagesMode}
                  onValueChange={setPagesMode}
                  id="p2i-pages"
                  options={[
                    { value: "all", label: `All pages${pageCount ? ` (${pageCount})` : ""}` },
                    { value: "first", label: "First page only" },
                  ]}
                />
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Convert to {ext.toUpperCase()}
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel={`Rendering pages as ${ext.toUpperCase()}…`} />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} additionalResults={wf.additional} onReset={reset} zipName={`${stripExtension(files[0]?.file.name ?? "pdf")}-pages.zip`} />}
    </div>
  );
}
