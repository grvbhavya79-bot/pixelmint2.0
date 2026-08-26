"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSelect } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { PdfLayoutBuilder, htmlToBlocks } from "@/lib/office/render-pdf";
import { stripExtension } from "@/lib/format";

async function mammothConvert(buffer: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
  return result.value;
}

export default function WordToPdfTool() {
  const queue = useFileQueue(ACCEPT.wordLike, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("word-to-pdf");
  const [pageSize, setPageSize] = useState("a4");

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const buffer = await files[0].file.arrayBuffer();
      const base = stripExtension(files[0].file.name);
      let html: string;
      try {
        html = await mammothConvert(buffer);
      } catch {
        throw new Error("This document could not be read. Make sure it is a valid .docx file (legacy .doc is not supported).");
      }
      const blocks = htmlToBlocks(html);
      const builder = new PdfLayoutBuilder();
      await builder.init({
        pageSize: pageSize === "letter" ? "letter" : "a4",
        title: base,
        baseFontSize: 11,
      });
      await builder.blocks(blocks);
      const bytes = await builder.save();
      return {
        filename: `${base}.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: files[0].file.size,
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            Headings, paragraphs and lists are carried over. Images and complex layouts may differ from Word.
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
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword" label="Drop a Word document here" hint="DOCX recommended (legacy DOC support is limited)" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <div className="rounded-xl border bg-card p-4">
                <OptionSelect
                  label="Page size"
                  value={pageSize}
                  onValueChange={setPageSize}
                  id="w2p-size"
                  options={[
                    { value: "a4", label: "A4" },
                    { value: "letter", label: "US Letter" },
                  ]}
                />
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Convert to PDF
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Rendering document to PDF…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
