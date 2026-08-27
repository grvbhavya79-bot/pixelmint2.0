"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorPanel, ProcessingStatus, ResultPanel, friendlyError, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionInput, OptionSwitch } from "@/components/tools/shared/option-controls";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

export default function TextToDocxTool() {
  const wf = useToolWorkflow("text-to-docx");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [firstLineHeading, setFirstLineHeading] = useState(true);

  const run = async () => {
    await wf.run(async () => {
      if (!text.trim()) throw new Error("Enter some text first.");
      const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
      const children: Paragraph[] = [];

      if (title.trim()) {
        children.push(new Paragraph({ text: title.trim(), heading: HeadingLevel.TITLE }));
      }
      blocks.forEach((block, i) => {
        const lines = block.split("\n");
        if (i === 0 && firstLineHeading && !title.trim() && lines.length === 1 && block.length < 80) {
          children.push(new Paragraph({ text: block, heading: HeadingLevel.HEADING_1 }));
          return;
        }
        lines.forEach((line) => {
          children.push(
            new Paragraph({
              children: [new TextRun(line || " ")],
              spacing: { after: 160 },
            }),
          );
        });
      });

      const doc = new Document({
        creator: "Pixelmint.fun",
        title: title || "Document",
        sections: [{ children }],
      });
      const blob = await Packer.toBlob(doc);
      return {
        filename: `${(title || "document").replace(/[^\w-]+/g, "-").toLowerCase() || "document"}.docx`,
        blob,
        extra: <p className="mt-3 text-xs text-muted-foreground">Opens in Word, Google Docs, Pages and LibreOffice.</p>,
      };
    });
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <div className="rounded-xl border bg-card p-4">
            <OptionInput label="Document title (optional)" value={title} onValueChange={setTitle} placeholder="My Document" id="ttd-title" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="ttd-text" className="text-[13px] font-medium text-foreground">Text content</label>
              <span className="text-xs text-muted-foreground">{text.length.toLocaleString()} characters</span>
            </div>
            <textarea
              id="ttd-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type your text. Blank lines separate paragraphs."
              className="focus-ring min-h-56 w-full resize-y rounded-xl border bg-card p-4 text-sm leading-relaxed placeholder:text-muted-foreground scrollbar-thin"
            />
          </div>
          <div className="rounded-xl border bg-card p-4">
            <OptionSwitch
              label="Use first line as heading"
              checked={firstLineHeading}
              onCheckedChange={setFirstLineHeading}
              hint="When enabled and no title is set, a short first line becomes a Heading 1."
              id="ttd-heading"
            />
          </div>
          <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy || !text.trim()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
            Create DOCX
          </Button>
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Building document…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={wf.reset} />}
    </div>
  );
}
