"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfDocument, extractPageLines } from "@/lib/pdf/client";
import { stripExtension } from "@/lib/format";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export default function PdfToWordTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("pdf-to-word");

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const doc = await loadPdfDocument(await files[0].file.arrayBuffer());
      const base = stripExtension(files[0].file.name);
      const children: Paragraph[] = [];

      children.push(new Paragraph({ text: base, heading: HeadingLevel.TITLE }));

      for (let p = 1; p <= doc.numPages; p++) {
        if (p > 1) children.push(new Paragraph({ text: "" , pageBreakBefore: true }));
        const lines = await extractPageLines(doc, p);
        for (const line of lines) {
          const text = line.items.map((i) => i.text).join(" ").replace(/\s+/g, " ").trim();
          if (!text) continue;
          const fontSize = line.items[0]?.height ?? 10;
          const isHeading = fontSize > 14 && text.length < 80;
          children.push(
            new Paragraph({
              text,
              heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
              spacing: { after: 120 },
              children: isHeading
                ? undefined
                : [new TextRun({ text, size: Math.round(Math.min(28, Math.max(18, fontSize * 1.6))) })],
            }),
          );
        }
      }
      await doc.destroy();

      const docx = new Document({
        creator: "Pixelmint.fun",
        title: base,
        sections: [{ children }],
      });
      const blob = await Packer.toBlob(docx);
      return {
        filename: `${base}.docx`,
        blob,
        originalSize: files[0].file.size,
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            Text and paragraph structure extracted. Complex layouts, images and tables are not reconstructed.
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
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="application/pdf,.pdf" label="Drop a PDF here to convert to Word" hint="Text-based PDFs work best — scans need PDF OCR first" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Convert to DOCX
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Extracting text and building DOCX…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
