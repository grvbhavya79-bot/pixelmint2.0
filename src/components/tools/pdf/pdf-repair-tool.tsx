"use client";

import { toast } from "sonner";
import { PDFDocument } from "@cantoo/pdf-lib";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { ACCEPT } from "@/lib/file-validate";
import { stripExtension } from "@/lib/format";

export default function PdfRepairTool() {
  const queue = useFileQueue({ accept: ["pdf", "unknown"], maxSize: 100 * 1024 * 1024 }, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("repair-pdf");

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const buffer = await files[0].file.arrayBuffer();
      let recoveredPages = 0;
      let strategy = "";

      // Pass 1: tolerant load + rebuild
      try {
        const doc = await PDFDocument.load(buffer, {
          ignoreEncryption: true,
          throwOnInvalidObject: false,
          updateMetadata: false,
          capNumbers: true,
        });
        if (doc.getPageCount() === 0) throw new Error("No pages found");
        const bytes = await doc.save({ useObjectStreams: true });
        recoveredPages = doc.getPageCount();
        strategy = "structure rebuild";
        return buildResult(bytes, recoveredPages, strategy);
      } catch {
        /* fall to pass 2 */
      }

      // Pass 2: trim garbage before/after the PDF body, then retry
      const text = new TextDecoder("latin1").decode(new Uint8Array(buffer));
      const start = text.indexOf("%PDF-");
      const end = text.lastIndexOf("%%EOF");
      if (start < 0 || end < 0 || end <= start) {
        throw new Error("This file has no recoverable PDF data at all.");
      }
      const sliced = buffer.slice(start, end + 5);
      const doc = await PDFDocument.load(sliced, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
        updateMetadata: false,
        capNumbers: true,
      });
      if (doc.getPageCount() === 0) {
        throw new Error("PDF structure was found but no pages could be recovered.");
      }
      const bytes = await doc.save({ useObjectStreams: true });
      recoveredPages = doc.getPageCount();
      strategy = "byte-level trim + rebuild";
      return buildResult(bytes, recoveredPages, strategy);
    });
  };

  const buildResult = (bytes: Uint8Array, pages: number, strategy: string) => ({
    filename: `${stripExtension(files[0].file.name)}-repaired.pdf`,
    blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
    originalSize: files[0].file.size,
    extra: (
      <p className="mt-3 text-xs text-muted-foreground">
        Recovered {pages} pages using {strategy}. Always review the output — badly damaged pages may still be incomplete.
      </p>
    ),
  });

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
            label="Drop a damaged PDF here"
            hint="We'll attempt multiple recovery passes"
            disabled={wf.busy}
          />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <div className="rounded-xl border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">How recovery works</p>
                <p className="mt-1">
                  Pass 1 re-parses the document leniently and rebuilds the file structure. Pass 2 scans for the actual
                  PDF body (between the %PDF header and the last %%EOF marker), removes trailing or leading garbage
                  bytes, and rebuilds. Recovery is not guaranteed — create backups of important files.
                </p>
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Attempt Repair
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Running recovery passes…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
