"use client";

import { useState } from "react";
import { toast } from "sonner";
import { degrees } from "@cantoo/pdf-lib";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionInput, OptionSelect } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfLib, parsePageRanges } from "@/lib/pdf/client";
import { stripExtension } from "@/lib/format";

export default function PdfRotateTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("rotate-pdf");
  const [angle, setAngle] = useState("90");
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
      const doc = await loadPdfLib(await files[0].file.arrayBuffer());
      const total = doc.getPageCount();
      const targets = pagesInput.trim()
        ? parsePageRanges(pagesInput, total)
        : Array.from({ length: total }, (_, i) => i + 1);
      if (targets.length === 0) throw new Error("No valid pages selected.");
      const turn = parseInt(angle, 10);
      for (const p of targets) {
        const page = doc.getPage(p - 1);
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + turn) % 360));
      }
      const bytes = await doc.save({ useObjectStreams: true });
      return {
        filename: `${stripExtension(files[0].file.name)}-rotated.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: files[0].file.size,
        extra: <p className="mt-3 text-xs text-muted-foreground">Rotated {targets.length} of {total} pages by {turn}°.</p>,
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
          <FileDropzone onFiles={(fs) => void onAdd(fs)} accept="application/pdf,.pdf" label="Drop a PDF here to rotate" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => { removeFile(files[0].id); setPageCount(null); }} />
              <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
                <OptionSelect
                  label="Rotation"
                  value={angle}
                  onValueChange={setAngle}
                  id="rotate-angle"
                  options={[
                    { value: "90", label: "90° clockwise" },
                    { value: "180", label: "180°" },
                    { value: "270", label: "270° (90° counter-clockwise)" },
                  ]}
                />
                <OptionInput
                  label="Pages (blank = all)"
                  value={pagesInput}
                  onValueChange={setPagesInput}
                  placeholder={pageCount ? `e.g. 1, 3-5 (of ${pageCount})` : "e.g. 1, 3-5"}
                  id="rotate-pages"
                />
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Rotate PDF
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Rotating pages…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
