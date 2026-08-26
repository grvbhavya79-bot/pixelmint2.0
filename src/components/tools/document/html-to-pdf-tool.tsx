"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorPanel, ProcessingStatus, ResultPanel, friendlyError, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSelect } from "@/components/tools/shared/option-controls";
import { PdfLayoutBuilder, htmlToBlocks } from "@/lib/office/render-pdf";

export default function HtmlToPdfTool() {
  const wf = useToolWorkflow("html-to-pdf");
  const [html, setHtml] = useState("");
  const [pageSize, setPageSize] = useState("a4");
  const [baseFontSize, setBaseFontSize] = useState("11");

  const run = async () => {
    await wf.run(async () => {
      if (!html.trim()) throw new Error("Paste some HTML first.");
      const blocks = htmlToBlocks(html);
      if (blocks.length === 0) throw new Error("No renderable content was found in this HTML.");
      const builder = new PdfLayoutBuilder();
      await builder.init({
        pageSize: pageSize === "letter" ? "letter" : "a4",
        baseFontSize: parseInt(baseFontSize, 10) || 11,
      });
      await builder.blocks(blocks);
      const bytes = await builder.save();
      return {
        filename: "page.pdf",
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            {blocks.length} content blocks rendered — headings, paragraphs, lists and tables. Scripts and external resources are ignored for safety.
          </p>
        ),
      };
    });
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <div>
            <label htmlFor="html-input" className="mb-1.5 block text-[13px] font-medium text-foreground">HTML source</label>
            <textarea
              id="html-input"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder={"<h1>Report</h1>\n<p>Hello <strong>world</strong></p>\n<ul><li>Item one</li><li>Item two</li></ul>"}
              className="focus-ring min-h-64 w-full resize-y rounded-xl border bg-card p-4 font-mono text-[13px] leading-relaxed placeholder:font-sans placeholder:text-muted-foreground scrollbar-thin"
            />
          </div>
          <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
            <OptionSelect
              label="Page size"
              value={pageSize}
              onValueChange={setPageSize}
              options={[
                { value: "a4", label: "A4" },
                { value: "letter", label: "US Letter" },
              ]}
              id="h2p-page"
            />
            <OptionSelect
              label="Base font size"
              value={baseFontSize}
              onValueChange={setBaseFontSize}
              options={[
                { value: "9", label: "9 pt — compact" },
                { value: "11", label: "11 pt — standard" },
                { value: "13", label: "13 pt — large" },
              ]}
              id="h2p-size"
            />
          </div>
          <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy || !html.trim()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
            Render PDF
          </Button>
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Laying out pages…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={wf.reset} />}
    </div>
  );
}
