"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfDocument, extractPageLines } from "@/lib/pdf/client";
import { stripExtension } from "@/lib/format";
import ExcelJS from "exceljs";

/** Group line items into columns by clustering x positions. */
function lineToRow(items: { text: string; x: number }[]): string[] {
  if (items.length <= 1) return [items.map((i) => i.text).join("")];
  const gapThreshold = 12; // minimum visual gap that implies a new column
  const columns: { text: string[]; x: number }[] = [];
  for (const item of items) {
    const last = columns[columns.length - 1];
    if (last && item.x - last.x < gapThreshold) {
      last.text.push(item.text);
      last.x = item.x;
    } else {
      columns.push({ text: [item.text], x: item.x });
    }
  }
  return columns.map((c) => c.text.join(" ").trim());
}

export default function PdfToExcelTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("pdf-to-excel");

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const doc = await loadPdfDocument(await files[0].file.arrayBuffer());
      const base = stripExtension(files[0].file.name);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "ToolBox100";
      const sheet = workbook.addWorksheet("Extracted");

      let totalRows = 0;
      for (let p = 1; p <= doc.numPages; p++) {
        const lines = await extractPageLines(doc, p);
        sheet.addRow([`— Page ${p} —`]).font = { bold: true };
        for (const line of lines) {
          const row = lineToRow(line.items);
          if (row.length === 1 && !row[0]) continue;
          sheet.addRow(row);
          totalRows++;
        }
      }
      await doc.destroy();

      if (totalRows === 0) {
        throw new Error("No extractable text found. This PDF may be scanned — run it through PDF OCR first.");
      }
      sheet.columns.forEach((column) => {
        column.width = 24;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return {
        filename: `${base}.xlsx`,
        blob: new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        originalSize: files[0].file.size,
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            {totalRows} rows extracted by analysing text positions. Review column splits — complex tables may need cleanup.
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
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="application/pdf,.pdf" label="Drop a PDF here to extract to Excel" hint="Text-based PDFs with tables work best" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Convert to XLSX
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Extracting data into spreadsheet…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
