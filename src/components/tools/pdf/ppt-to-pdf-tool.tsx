"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { LIMITS } from "@/lib/file-validate";
import { PdfLayoutBuilder } from "@/lib/office/render-pdf";
import { sanitizeWinAnsi, stripExtension } from "@/lib/format";
import { unzipSync, strFromU8 } from "fflate";

interface SlideContent {
  title: string;
  body: string[];
}

/** Extract text from pptx slide XML (a:t elements inside paragraphs). */
function parseSlides(files: Record<string, Uint8Array>): SlideContent[] {
  const slideEntries = Object.entries(files)
    .filter(([name]) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = parseInt(a[0].match(/(\d+)\.xml$/)?.[1] ?? "0", 10);
      const nb = parseInt(b[0].match(/(\d+)\.xml$/)?.[1] ?? "0", 10);
      return na - nb;
    });

  return slideEntries.map(([, data]) => {
    const xml = strFromU8(data);
    const paragraphs = xml.split(/<a:p[ >]/).slice(1);
    const lines: string[] = [];
    for (const p of paragraphs) {
      const texts = [...p.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
      const line = texts.join("").trim();
      if (line) lines.push(sanitizeWinAnsi(line));
    }
    return {
      title: lines[0] ?? "Slide",
      body: lines.slice(1),
    };
  });
}

export default function PptToPdfTool() {
  const queue = useFileQueue({ accept: ["zip"], maxSize: LIMITS.document }, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("powerpoint-to-pdf");

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      const buffer = await files[0].file.arrayBuffer();
      const base = stripExtension(files[0].file.name);
      let unzipped: Record<string, Uint8Array>;
      try {
        unzipped = unzipSync(new Uint8Array(buffer), {
          filter: (file) => /^ppt\/slides\/slide\d+\.xml$/.test(file.name),
        });
      } catch {
        throw new Error("This presentation could not be opened. Please provide a valid .pptx file.");
      }
      const slides = parseSlides(unzipped);
      if (slides.length === 0) {
        throw new Error("No slides with text were found in this presentation.");
      }

      const builder = new PdfLayoutBuilder();
      await builder.init({ pageSize: "a4l", title: base, baseFontSize: 12 });
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        if (i > 0) await builder.blocks([{ type: "spacer", height: 24 }]);
        await builder.blocks([
          { type: "heading", level: 2, text: `${i + 1}. ${slide.title}` },
        ]);
        for (const line of slide.body) {
          await builder.blocks([{ type: "paragraph", text: line, bullet: true }]);
        }
      }

      const bytes = await builder.save();
      return {
        filename: `${base}.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: files[0].file.size,
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            {slides.length} slides converted with their text content (one page per slide).
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
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" label="Drop a PowerPoint file here" hint="PPTX format (PowerPoint 2007+)" disabled={wf.busy} />
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
      <ProcessingStatus status={wf.status} stepLabel="Extracting slides…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
