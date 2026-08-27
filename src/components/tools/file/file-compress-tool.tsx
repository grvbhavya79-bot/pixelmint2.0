"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSelect } from "@/components/tools/shared/option-controls";
import { LIMITS } from "@/lib/file-validate";
import { zipSync } from "fflate";

export default function FileCompressTool() {
  const queue = useFileQueue(
    { accept: ["pdf", "png", "jpeg", "webp", "bmp", "gif", "zip", "docx", "doc", "unknown"], maxSize: LIMITS.zip },
    { multiple: true },
  );
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("file-compressor");
  const [level, setLevel] = useState("6");

  const run = async () => {
    if (files.length === 0) return;
    await wf.run(async () => {
      const zipFiles: Record<string, Uint8Array> = {};
      for (const item of files) {
        zipFiles[item.file.name] = new Uint8Array(await item.file.arrayBuffer());
      }
      const zipped = zipSync(zipFiles, { level: parseInt(level, 10) as 0 | 6 | 9 });
      const blob = new Blob([zipped as unknown as BlobPart], { type: "application/zip" });
      return {
        filename: "compressed-files.zip",
        blob,
        originalSize: files.reduce((s, f) => s + f.file.size, 0),
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            {files.length} files compressed into one archive. Already-compressed formats (JPG, PDF, ZIP) shrink less.
          </p>
        ),
      };
    });
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} multiple label="Drop any files here to compress" hint={`Up to ${Math.round(LIMITS.zip / 1024 / 1024)} MB total`} disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files.length > 0 && (
            <>
              <div className="space-y-2">
                {files.map((f) => (
                  <FileListRow key={f.id} item={f} onRemove={() => removeFile(f.id)} />
                ))}
              </div>
              <div className="rounded-xl border bg-card p-4">
                <OptionSelect
                  label="Compression level"
                  value={level}
                  onValueChange={setLevel}
                  options={[
                    { value: "0", label: "Store (fastest)" },
                    { value: "6", label: "Balanced (recommended)" },
                    { value: "9", label: "Maximum (slowest, smallest)" },
                  ]}
                  id="fc-level"
                />
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Compress {files.length} File{files.length === 1 ? "" : "s"}
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Compressing files…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={() => { clear(); wf.reset(); }} />}
    </div>
  );
}
