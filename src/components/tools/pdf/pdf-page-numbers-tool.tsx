"use client";

import { useState } from "react";
import { StandardFonts } from "@cantoo/pdf-lib";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionInput, OptionSelect, OptionSlider } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfLib } from "@/lib/pdf/client";
import { sanitizeWinAnsi, stripExtension } from "@/lib/format";

type Format = "plain" | "pageX" | "xOfY" | "custom";

export default function PdfPageNumbersTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("pdf-page-numbers");
  const [format, setFormat] = useState<Format>("plain");
  const [customPattern, setCustomPattern] = useState("Page {n} of {total}");
  const [position, setPosition] = useState("bc");
  const [fontSize, setFontSize] = useState(10);
  const [startNumber, setStartNumber] = useState("1");
  const [pagesFrom, setPagesFrom] = useState("1");

  const POSITIONS = [
    { value: "tl", label: "Top left" },
    { value: "tc", label: "Top center" },
    { value: "tr", label: "Top right" },
    { value: "bl", label: "Bottom left" },
    { value: "bc", label: "Bottom center" },
    { value: "br", label: "Bottom right" },
  ];

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const doc = await loadPdfLib(await files[0].file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const start = parseInt(startNumber, 10) || 1;
      const from = Math.max(1, Math.min(pages.length, parseInt(pagesFrom, 10) || 1));
      const total = pages.length - from + 1;

      pages.forEach((page, index) => {
        const pageNum = index + 1;
        if (pageNum < from) return;
        const display = start + (pageNum - from);
        let label: string;
        switch (format) {
          case "pageX": label = `Page ${display}`; break;
          case "xOfY": label = `${display} / ${start + total - 1}`; break;
          case "custom": label = customPattern.replace(/\{n\}/g, String(display)).replace(/\{total\}/g, String(start + total - 1)); break;
          default: label = String(display);
        }
        label = sanitizeWinAnsi(label);
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(label, fontSize);
        const margin = 28;
        const [v, h] = [position[0], position[1]];
        const x = h === "l" ? margin : h === "c" ? (width - textWidth) / 2 : width - textWidth - margin;
        const y = v === "t" ? height - margin - fontSize : margin;
        page.drawText(label, { x, y, size: fontSize, font, color: undefined });
      });

      const bytes = await doc.save({ useObjectStreams: true });
      return {
        filename: `${stripExtension(files[0].file.name)}-numbered.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: files[0].file.size,
        extra: <p className="mt-3 text-xs text-muted-foreground">Numbered pages {from}–{pages.length} starting at {start}.</p>,
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
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="application/pdf,.pdf" label="Drop a PDF here to add page numbers" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
                <OptionSelect
                  label="Number format"
                  value={format}
                  onValueChange={setFormat}
                  id="pn-format"
                  options={[
                    { value: "plain", label: "1, 2, 3…" },
                    { value: "pageX", label: "Page 1, Page 2…" },
                    { value: "xOfY", label: "1 / 12" },
                    { value: "custom", label: "Custom pattern" },
                  ]}
                />
                {format === "custom" && (
                  <OptionInput label="Pattern" value={customPattern} onValueChange={setCustomPattern} hint="Use {n} for the page number and {total} for the count." id="pn-pattern" />
                )}
                <OptionSelect label="Position" value={position} onValueChange={setPosition} options={POSITIONS} id="pn-pos" />
                <OptionSlider label="Font size" value={fontSize} onValueChange={setFontSize} min={7} max={24} unit=" pt" />
                <OptionInput label="Start numbering at" type="number" value={startNumber} onValueChange={setStartNumber} min={1} id="pn-start" />
                <OptionInput label="First numbered page" type="number" value={pagesFrom} onValueChange={setPagesFrom} min={1} id="pn-from" hint="Leave cover pages unnumbered by starting later." />
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Add Page Numbers
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Adding page numbers…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
