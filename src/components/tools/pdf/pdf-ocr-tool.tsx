"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSelect } from "@/components/tools/shared/option-controls";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfDocument, renderPdfPage } from "@/lib/pdf/client";
import { stripExtension } from "@/lib/format";

const LANGUAGES = [
  { value: "eng", label: "English" },
  { value: "hin", label: "Hindi" },
  { value: "spa", label: "Spanish" },
  { value: "fra", label: "French" },
  { value: "deu", label: "German" },
  { value: "ita", label: "Italian" },
  { value: "por", label: "Portuguese" },
  { value: "nld", label: "Dutch" },
];

export default function PdfOcrTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("pdf-ocr");
  const [lang, setLang] = useState("eng");
  const [progress, setProgress] = useState("");

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const doc = await loadPdfDocument(await files[0].file.arrayBuffer());
      const base = stripExtension(files[0].file.name);
      const pagesText: string[] = [];

      let recognize: (image: string) => Promise<{ data: { text: string } }>;
      try {
        const tesseract = await import("tesseract.js");
        const worker = await tesseract.createWorker(lang, 1, {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === "recognizing text") setProgress(`OCR page progress: ${Math.round(m.progress * 100)}%`);
          },
        });
        recognize = async (image: string) =>
          (await worker.recognize(image)) as unknown as { data: { text: string } };
        for (let p = 1; p <= doc.numPages; p++) {
          setProgress(`Rendering page ${p} of ${doc.numPages}…`);
          const { canvas } = await renderPdfPage(doc, p, 2);
          const dataUrl = canvas.toDataURL("image/png");
          setProgress(`Running OCR on page ${p} of ${doc.numPages}…`);
          const { data } = await recognize(dataUrl);
          pagesText.push(data.text.trim());
        }
        await worker.terminate();
      } catch {
        throw new Error(
          "The OCR engine could not load its language model (it downloads on first use and needs an internet connection). Please check your connection and try again.",
        );
      }

      const text = pagesText
        .map((t, i) => `===== Page ${i + 1} =====\n\n${t}`)
        .join("\n\n\n");
      if (!text.replace(/=|\s/g, "")) {
        throw new Error("No readable text was detected — the pages may be blank or extremely low quality.");
      }
      await doc.destroy();

      return {
        filename: `${base}-ocr.txt`,
        blob: new Blob([text], { type: "text/plain;charset=utf-8" }),
        originalSize: files[0].file.size,
        extra: (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              Recognized text from {pagesText.length} pages · language: {LANGUAGES.find((l) => l.value === lang)?.label}. Review the output — OCR accuracy depends on scan quality.
            </p>
          </div>
        ),
      };
    });
    setProgress("");
  };

  const reset = () => {
    clear();
    wf.reset();
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="application/pdf,.pdf" label="Drop a scanned PDF here" hint="OCR runs in your browser — the language model downloads on first use" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <div className="rounded-xl border bg-card p-4">
                <OptionSelect
                  label="Recognition language"
                  value={lang}
                  onValueChange={setLang}
                  options={LANGUAGES}
                  id="ocr-lang"
                  hint="Clean, high-resolution scans give the best results."
                />
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Run OCR
              </Button>
              {wf.busy && progress && <p className="text-sm text-muted-foreground" role="status">{progress}</p>}
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Running optical character recognition…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
