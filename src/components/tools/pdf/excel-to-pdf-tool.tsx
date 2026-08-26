"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { ACCEPT } from "@/lib/file-validate";
import { PdfLayoutBuilder } from "@/lib/office/render-pdf";
import { sanitizeWinAnsi, stripExtension } from "@/lib/format";
import ExcelJS from "exceljs";

export default function ExcelToPdfTool() {
  const queue = useFileQueue({ accept: ["zip"], maxSize: 50 * 1024 * 1024 }, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("excel-to-pdf");

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const buffer = await files[0].file.arrayBuffer();
      const base = stripExtension(files[0].file.name);
      const workbook = new ExcelJS.Workbook();
      try {
        await workbook.xlsx.load(buffer);
      } catch {
        throw new Error("This spreadsheet could not be read. Please provide a valid .xlsx file.");
      }
      if (workbook.worksheets.length === 0) {
        throw new Error("This workbook has no worksheets.");
      }

      const builder = new PdfLayoutBuilder();
      await builder.init({ pageSize: "a4", title: base, baseFontSize: 9 });

      for (let sheetIndex = 0; sheetIndex < workbook.worksheets.length; sheetIndex++) {
        const sheet = workbook.worksheets[sheetIndex];
        if (sheetIndex > 0) await builder.blocks([{ type: "spacer", height: 8 }]);
        await builder.blocks([{ type: "heading", level: 2, text: sanitizeWinAnsi(sheet.name) }]);
        const rows: string[][] = [];
        sheet.eachRow({ includeEmpty: false }, (row) => {
          const values: string[] = [];
          row.eachCell({ includeEmpty: true }, (cell) => {
            const v = cell.value;
            let text = "";
            if (v === null || v === undefined) text = "";
            else if (typeof v === "object") {
              if ("text" in v && typeof (v as { text?: string }).text === "string") text = (v as { text: string }).text;
              else if ("result" in v && typeof (v as { result?: unknown }).result !== "undefined") text = String((v as { result: unknown }).result);
              else if ("richText" in v) text = ((v as { richText: { text: string }[] }).richText ?? []).map((r) => r.text).join("");
              else text = String(v);
            } else text = String(v);
            values.push(sanitizeWinAnsi(text).slice(0, 120));
          });
          rows.push(values);
        });
        if (rows.length === 0) rows.push(["(empty sheet)"]);
        builder.table(rows, { header: false, fontSize: 8 });
      }

      const bytes = await builder.save();
      return {
        filename: `${base}.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: files[0].file.size,
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            {workbook.worksheets.length} worksheet{workbook.worksheets.length === 1 ? "" : "s"} rendered as PDF tables.
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
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" label="Drop an Excel file here" hint="XLSX format (Excel 2007+)" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Convert to PDF
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Rendering worksheets to PDF…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
