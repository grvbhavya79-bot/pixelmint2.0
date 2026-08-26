"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorPanel, ProcessingStatus, ResultPanel, friendlyError, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionInput, OptionSelect } from "@/components/tools/shared/option-controls";
import { PdfLayoutBuilder } from "@/lib/office/render-pdf";
import { sanitizeWinAnsi } from "@/lib/format";

export default function TextToPdfTool() {
  const wf = useToolWorkflow("text-to-pdf");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [fontFamily, setFontFamily] = useState("helvetica");
  const [fontSize, setFontSize] = useState("11");
  const [pageSize, setPageSize] = useState("a4");

  const run = async () => {
    await wf.run(async () => {
      if (!text.trim()) throw new Error("Enter some text first.");
      const builder = new PdfLayoutBuilder();
      await builder.init({
        pageSize: pageSize === "letter" ? "letter" : "a4",
        fontFamily: fontFamily as "helvetica" | "times" | "courier",
        baseFontSize: parseInt(fontSize, 10) || 11,
        title: title || "Document",
      });
      if (title.trim()) {
        await builder.blocks([{ type: "heading", level: 1, text: sanitizeWinAnsi(title) }]);
      }
      for (const paragraph of text.split(/\n\s*\n/)) {
        if (paragraph.trim()) {
          await builder.blocks([{ type: "paragraph", text: paragraph.trim() }]);
        }
      }
      const bytes = await builder.save();
      return {
        filename: `${(title || "text").replace(/[^\w-]+/g, "-").toLowerCase() || "text"}.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        extra: <p className="mt-3 text-xs text-muted-foreground">Text rendered with word wrapping and paragraph spacing.</p>,
      };
    });
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <div>
            <label htmlFor="ttp-text" className="mb-1.5 block text-[13px] font-medium text-foreground">Text content</label>
            <textarea
              id="ttp-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type the text you want in the PDF. Blank lines create new paragraphs."
              className="focus-ring min-h-48 w-full resize-y rounded-xl border bg-card p-4 text-sm leading-relaxed placeholder:text-muted-foreground scrollbar-thin"
            />
          </div>
          <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
            <OptionInput label="Document title (optional)" value={title} onValueChange={setTitle} placeholder="My Document" id="ttp-title" />
            <OptionSelect
              label="Font"
              value={fontFamily}
              onValueChange={setFontFamily}
              options={[
                { value: "helvetica", label: "Helvetica (clean sans)" },
                { value: "times", label: "Times (classic serif)" },
                { value: "courier", label: "Courier (monospace)" },
              ]}
              id="ttp-font"
            />
            <OptionSelect
              label="Font size"
              value={fontSize}
              onValueChange={setFontSize}
              options={[
                { value: "9", label: "9 pt — compact" },
                { value: "11", label: "11 pt — standard" },
                { value: "13", label: "13 pt — large" },
                { value: "16", label: "16 pt — extra large" },
              ]}
              id="ttp-size"
            />
            <OptionSelect
              label="Page size"
              value={pageSize}
              onValueChange={setPageSize}
              options={[
                { value: "a4", label: "A4" },
                { value: "letter", label: "US Letter" },
              ]}
              id="ttp-page"
            />
          </div>
          <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy || !text.trim()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
            Convert to PDF
          </Button>
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Typesetting PDF…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={wf.reset} />}
    </div>
  );
}
