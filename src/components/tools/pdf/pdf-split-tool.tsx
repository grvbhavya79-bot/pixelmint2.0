"use client";

import { useState } from "react";
import { PDFDocument } from "@cantoo/pdf-lib";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionInput, OptionSwitch, SegmentedControl } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfLib, parsePageGroups } from "@/lib/pdf/client";
import { stripExtension } from "@/lib/format";

type Mode = "ranges" | "interval";

export default function PdfSplitTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("split-pdf");
  const [mode, setMode] = useState<Mode>("ranges");
  const [ranges, setRanges] = useState("");
  const [interval, setIntervalValue] = useState(1);
  const [separateFiles, setSeparateFiles] = useState(true);
  const [pageCount, setPageCount] = useState<number | null>(null);

  const loadInfo = async (file: File) => {
    try {
      const doc = await loadPdfLib(await file.arrayBuffer());
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(null);
    }
  };

  const onAdd = async (fs: File[]) => {
    await addFiles(fs);
    if (fs[0]) void loadInfo(fs[0]);
  };

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const src = await loadPdfLib(await files[0].file.arrayBuffer());
      const total = src.getPageCount();
      const base = stripExtension(files[0].file.name);

      let groups: number[][] = [];
      if (mode === "ranges") {
        groups = parsePageGroups(ranges, total);
        if (groups.length === 0) throw new Error("Enter valid page ranges, e.g. 1-3, 5, 8-10.");
      } else {
        const size = Math.max(1, Math.round(interval));
        for (let i = 1; i <= total; i += size) {
          groups.push(Array.from({ length: Math.min(size, total - i + 1) }, (_, k) => i + k));
        }
      }

      const outputs: { name: string; blob: Blob }[] = [];
      if (!separateFiles || groups.length === 1) {
        const out = await PDFDocument.create();
        const indices = groups.flat().map((p) => p - 1);
        const copied = await out.copyPages(src, indices);
        copied.forEach((p) => out.addPage(p));
        outputs.push({
          name: `${base}-split.pdf`,
          blob: new Blob([await out.save({ useObjectStreams: true }) as unknown as BlobPart], { type: "application/pdf" }),
        });
      } else {
        for (let g = 0; g < groups.length; g++) {
          const out = await PDFDocument.create();
          const copied = await out.copyPages(src, groups[g].map((p) => p - 1));
          copied.forEach((p) => out.addPage(p));
          outputs.push({
            name: `${base}-pages-${groups[g][0]}-${groups[g][groups[g].length - 1]}.pdf`,
            blob: new Blob([await out.save({ useObjectStreams: true }) as unknown as BlobPart], { type: "application/pdf" }),
          });
        }
      }

      if (outputs.length === 1) {
        return {
          filename: outputs[0].name,
          blob: outputs[0].blob,
          originalSize: files[0].file.size,
        };
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
    setRanges("");
    setPageCount(null);
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone
            onFiles={(fs) => void onAdd(fs)}
            accept="application/pdf,.pdf"
            label="Drop a PDF here to split"
            disabled={wf.busy}
          />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => { removeFile(files[0].id); setPageCount(null); }} />
              {pageCount && (
                <p className="text-xs text-muted-foreground" role="status">
                  Loaded: {pageCount} pages
                </p>
              )}
              <div className="space-y-4 rounded-xl border bg-card p-4">
                <SegmentedControl
                  ariaLabel="Split mode"
                  value={mode}
                  onValueChange={setMode}
                  options={[
                    { value: "ranges", label: "Custom ranges" },
                    { value: "interval", label: "Fixed interval" },
                  ]}
                />
                {mode === "ranges" ? (
                  <OptionInput
                    label="Page ranges"
                    value={ranges}
                    onValueChange={setRanges}
                    placeholder={pageCount ? `e.g. 1-3, 5, ${Math.min(8, pageCount)}-${pageCount}` : "e.g. 1-3, 5, 8-10"}
                    hint="Comma-separated pages or ranges. Each range becomes its own PDF."
                    id="split-ranges"
                  />
                ) : (
                  <OptionInput
                    label="Pages per file"
                    type="number"
                    value={interval}
                    min={1}
                    max={pageCount ?? 1000}
                    onValueChange={(v) => setIntervalValue(parseInt(v, 10) || 1)}
                    hint={`A ${pageCount ?? "?"}-page PDF with interval ${interval || 1} produces ${Math.ceil((pageCount ?? 0) / Math.max(1, interval || 1))} files.`}
                    id="split-interval"
                  />
                )}
                <OptionSwitch
                  label="Separate file per range"
                  checked={separateFiles}
                  onCheckedChange={setSeparateFiles}
                  hint="Off = all selected pages combined into one PDF"
                  id="split-separate"
                />
              </div>
              <Button
                onClick={() => void run().catch((e) => toast.error(friendlyError(e)))}
                disabled={wf.busy}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                size="lg"
              >
                Split PDF
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Splitting pages…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && (
        <ResultPanel result={wf.result} additionalResults={wf.additional} onReset={reset} zipName={`${stripExtension(files[0]?.file.name ?? "document")}-split.zip`} />
      )}
    </div>
  );
}
