"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfDocument, renderPdfPage } from "@/lib/pdf/client";
import { canvasToBlob } from "@/lib/imaging";
import { stripExtension } from "@/lib/format";

export default function PdfToPptTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("pdf-to-powerpoint");

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const pptxgen = (await import("pptxgenjs")).default;
      const doc = await loadPdfDocument(await files[0].file.arrayBuffer());
      const base = stripExtension(files[0].file.name);

      const pptx = new pptxgen();
      pptx.author = "Pixelmint.fun";
      pptx.title = base;

      for (let p = 1; p <= doc.numPages; p++) {
        const { canvas } = await renderPdfPage(doc, p, 2);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const page = await doc.getPage(p);
        const viewport = page.getViewport({ scale: 1 });
        const isLandscape = viewport.width > viewport.height;
        const slide = pptx.addSlide();
        if (isLandscape) slide.addImage({ data: dataUrl, x: 0, y: 0, w: "100%", h: "100%" });
        else slide.addImage({ data: dataUrl, x: 1.25, y: 0, w: 8.5 * 0.94, h: 5.63 * 0.94 });
        page.cleanup();
      }
      await doc.destroy();

      const blob = (await pptx.write({ outputType: "blob" })) as Blob;
      return {
        filename: `${base}.pptx`,
        blob,
        originalSize: files[0].file.size,
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            {doc.numPages} slides created — each PDF page is a full-quality slide image you can arrange in PowerPoint.
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
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="application/pdf,.pdf" label="Drop a PDF here to convert to PowerPoint" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Convert to PPTX
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Building slides…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
