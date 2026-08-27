"use client";

import { useState } from "react";
import { PDFDocument } from "@cantoo/pdf-lib";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionInput } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfLib, parsePageRanges } from "@/lib/pdf/client";
import { stripExtension } from "@/lib/format";

/** Shared engine for Delete PDF Pages & Extract PDF Pages. */
export default function PdfPagesTool({ mode = "delete" }: { mode?: string }) {
  const isDelete = mode === "delete";
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow(isDelete ? "delete-pdf-pages" : "extract-pdf-pages");
  const [pagesInput, setPagesInput] = useState("");
  const [pageCount, setPageCount] = useState<number | null>(null);

  const onAdd = async (fs: File[]) => {
    await addFiles(fs);
    try {
      const doc = await loadPdfLib(await fs[0].arrayBuffer());
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(null);
    }
  };

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const buffer = await files[0].file.arrayBuffer();
      const src = await loadPdfLib(buffer);
      const total = src.getPageCount();
      const selected = parsePageRanges(pagesInput, total);
      if (selected.length === 0) throw new Error("Enter at least one valid page number.");
      if (isDelete && selected.length === total) throw new Error("You can't delete every page — keep at least one.");

      const out = await PDFDocument.create();
      out.setProducer("Pixelmint.fun");
      const keep = isDelete
        ? Array.from({ length: total }, (_, i) => i + 1).filter((p) => !selected.includes(p))
        : selected;
      const copied = await out.copyPages(src, keep.map((p) => p - 1));
      copied.forEach((p) => out.addPage(p));
      const bytes = await out.save({ useObjectStreams: true });

      return {
        filename: `${stripExtension(files[0].file.name)}-${isDelete ? "pages-removed" : "extracted"}.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: files[0].file.size,
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            {isDelete
              ? `Removed ${selected.length} page${selected.length === 1 ? "" : "s"} · ${keep.length} remain.`
              : `Extracted ${selected.length} page${selected.length === 1 ? "" : "s"} into a new PDF.`}
          </p>
        ),
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setPagesInput("");
    setPageCount(null);
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone
            onFiles={(fs) => void onAdd(fs)}
            accept="application/pdf,.pdf"
            label={isDelete ? "Drop a PDF here to delete pages" : "Drop a PDF here to extract pages"}
            disabled={wf.busy}
          />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => { removeFile(files[0].id); setPageCount(null); }} />
              {pageCount && <p className="text-xs text-muted-foreground">Loaded: {pageCount} pages</p>}
              <div className="rounded-xl border bg-card p-4">
                <OptionInput
                  label={isDelete ? "Pages to delete" : "Pages to extract"}
                  value={pagesInput}
                  onValueChange={setPagesInput}
                  placeholder={pageCount ? `e.g. 1, 3-5 (of ${pageCount})` : "e.g. 1, 3-5"}
                  hint="Use commas for single pages and hyphens for ranges."
                  id="pages-input"
                />
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                {isDelete ? "Delete Pages" : "Extract Pages"}
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel={isDelete ? "Deleting pages…" : "Extracting pages…"} />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
