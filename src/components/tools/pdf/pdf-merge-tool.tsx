"use client";

import { PDFDocument } from "@cantoo/pdf-lib";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import {
  ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow,
} from "@/components/tools/shared/tool-runner";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfLib } from "@/lib/pdf/client";
import { stripExtension } from "@/lib/format";

export default function PdfMergeTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: true });
  const { files, addFiles, removeFile, moveFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("merge-pdf");

  const run = async () => {
    if (files.length < 2) {
      setError("Add at least two PDF files to merge.");
      return;
    }
    await wf.run(async () => {
      const merged = await PDFDocument.create();
      merged.setProducer("Pixelmint.fun");
      for (const item of files) {
        const src = await loadPdfLib(await item.file.arrayBuffer());
        const copied = await merged.copyPages(src, src.getPageIndices());
        copied.forEach((p) => merged.addPage(p));
      }
      const bytes = await merged.save({ useObjectStreams: true });
      const name = `${stripExtension(files[0].file.name)}-merged.pdf`;
      return {
        filename: name,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: files.reduce((sum, f) => sum + f.file.size, 0),
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
            accept="application/pdf,.pdf"
            multiple
            label="Drop PDF files here to merge"
            hint="Add 2 or more PDFs · they merge in list order"
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
              <Button
                onClick={() => void run().catch((e) => { setError(friendlyError(e)); toast.error(friendlyError(e)); })}
                disabled={wf.busy || files.length < 2}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                size="lg"
              >
                Merge PDF ({files.length} files)
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Merging PDFs…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && (
        <ResultPanel
          result={{
            ...wf.result,
            extra: (
              <p className="mt-3 text-xs text-muted-foreground">
                Merged {files.length} documents · {files.map((f) => stripExtension(f.file.name)).join(" + ")}
              </p>
            ),
          }}
          onReset={reset}
        />
      )}
    </div>
  );
}
