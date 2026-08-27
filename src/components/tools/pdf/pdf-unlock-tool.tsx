"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfLib } from "@/lib/pdf/client";
import { PDFDocument } from "@cantoo/pdf-lib";
import { stripExtension } from "@/lib/format";

export default function PdfUnlockTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("unlock-pdf");
  const [password, setPassword] = useState("");

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      if (!password) throw new Error("Enter the password you use to open this PDF.");
      const buffer = await files[0].file.arrayBuffer();
      let src: PDFDocument;
      try {
        src = await PDFDocument.load(buffer, {
          password,
          ignoreEncryption: true,
          throwOnInvalidObject: false,
        });
      } catch {
        throw new Error("That password didn't work. Check it and try again.");
      }
      // Rebuild into a fresh unencrypted document
      const out = await PDFDocument.create();
      out.setProducer("Pixelmint.fun");
      const copied = await out.copyPages(src, src.getPageIndices());
      copied.forEach((p) => out.addPage(p));
      const bytes = await out.save({ useObjectStreams: true });
      return {
        filename: `${stripExtension(files[0].file.name)}-unlocked.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: files[0].file.size,
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            Saved without encryption — the copy opens without a password. Only unlock documents you own or are authorized to modify.
          </p>
        ),
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setPassword("");
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="application/pdf,.pdf" label="Drop a protected PDF here" hint="You'll need the password that opens it" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <div className="rounded-xl border bg-card p-4">
                <Label htmlFor="unlock-pw" className="text-[13px] font-medium">PDF password</Label>
                <Input
                  id="unlock-pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="The password you use to open this file"
                  autoComplete="off"
                  className="mt-1.5"
                />
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                <Unlock size={15} className="mr-1.5" aria-hidden="true" />
                Unlock PDF
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Removing encryption…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
