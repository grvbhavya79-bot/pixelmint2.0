"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionInput, OptionSelect } from "@/components/tools/shared/option-controls";
import { LIMITS } from "@/lib/file-validate";
import { zipSync, unzipSync, strFromU8 } from "fflate";
import { saveBlob } from "@/lib/download";
import { formatBytes, stripExtension } from "@/lib/format";
import { Download } from "lucide-react";

export default function ZipTool({ mode = "create" }: { mode?: string }) {
  const isCreate = mode === "create";
  const queue = useFileQueue(
    isCreate ? { accept: ["pdf", "png", "jpeg", "webp", "bmp", "gif", "zip", "docx", "doc", "unknown"], maxSize: LIMITS.zip } : { accept: ["zip"], maxSize: LIMITS.zip },
    { multiple: isCreate, images: false },
  );
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow(isCreate ? "zip-creator" : "zip-extractor");
  const [zipName, setZipName] = useState("archive");
  const [level, setLevel] = useState("6");
  const [entries, setEntries] = useState<{ name: string; size: number; data: Uint8Array }[]>([]);
  const [extractedBlob, setExtractedBlob] = useState<Blob | null>(null);

  const run = async () => {
    if (isCreate) {
      if (files.length === 0) return;
      await wf.run(async () => {
        const zipFiles: Record<string, Uint8Array> = {};
        for (const item of files) {
          zipFiles[item.file.name] = new Uint8Array(await item.file.arrayBuffer());
        }
        const zipped = zipSync(zipFiles, { level: parseInt(level, 10) as 0 | 6 | 9 });
        const blob = new Blob([zipped as unknown as BlobPart], { type: "application/zip" });
        return {
          filename: `${zipName || "archive"}.zip`,
          blob,
          originalSize: files.reduce((s, f) => s + f.file.size, 0),
          extra: <p className="mt-3 text-xs text-muted-foreground">{files.length} files archived.</p>,
        };
      });
    } else {
      if (!files[0]) return;
      await wf.run(async () => {
        const buffer = await files[0].file.arrayBuffer();
        let unzipped: Record<string, Uint8Array>;
        try {
          unzipped = unzipSync(new Uint8Array(buffer), {
            filter: (file) => {
              // path traversal protection: skip entries with .. or absolute paths
              const safe = !file.name.split("/").includes("..") && !file.name.startsWith("/");
              return safe;
            },
          });
        } catch {
          throw new Error("This archive could not be read. Make sure it is a valid ZIP file.");
        }
        const names = Object.keys(unzipped);
        if (names.length === 0) throw new Error("The archive is empty.");
        const list = names.map((name) => ({
          name,
          size: unzipped[name].length,
          data: unzipped[name],
        }));
        setEntries(list);
        // if single file, offer it directly; otherwise zip of extracted? they already have zip — offer individual downloads
        if (list.length === 1) {
          const blob = new Blob([list[0].data as unknown as BlobPart], { type: "application/octet-stream" });
          setExtractedBlob(blob);
          return {
            filename: list[0].name.split("/").pop() || "extracted-file",
            blob,
            originalSize: files[0].file.size,
          };
        }
        // create a fresh uncompressed (store) zip so users can download everything at once
        const rebuilt = zipSync(Object.fromEntries(list.map((e) => [e.name, e.data])), { level: 0 });
        const zipBlob = new Blob([rebuilt as unknown as BlobPart], { type: "application/zip" });
        setExtractedBlob(zipBlob);
        return {
          filename: `${stripExtension(files[0].file.name)}-extracted.zip`,
          blob: zipBlob,
          originalSize: files[0].file.size,
          extra: (
            <div className="mt-3">
              <p className="text-xs font-semibold text-foreground">{list.length} files inside:</p>
              <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto scrollbar-thin rounded-lg bg-card/70 p-2">
                {list.map((e) => (
                  <li key={e.name} className="flex justify-between gap-3 text-[11px] text-muted-foreground">
                    <button
                      type="button"
                      className="truncate text-left text-primary hover:underline"
                      onClick={() => saveBlob(new Blob([e.data as unknown as BlobPart], { type: "application/octet-stream" }), e.name.split("/").pop() || "file")}
                    >
                      {e.name}
                    </button>
                    <span className="shrink-0 font-mono">{formatBytes(e.size)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[11px] text-muted-foreground">Click any file to download it individually.</p>
            </div>
          ),
        };
      });
    }
  };

  const reset = () => {
    clear();
    wf.reset();
    setEntries([]);
    setExtractedBlob(null);
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone
            onFiles={(fs) => void addFiles(fs)}
            accept={isCreate ? undefined : ".zip,application/zip"}
            multiple={isCreate}
            label={isCreate ? "Drop files here to create a ZIP" : "Drop a ZIP archive here to open it"}
            disabled={wf.busy}
          />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files.length > 0 && (
            <>
              <div className="space-y-2">
                {files.map((f) => (
                  <FileListRow key={f.id} item={f} onRemove={() => removeFile(f.id)} />
                ))}
              </div>
              {isCreate && (
                <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
                  <OptionInput label="Archive name" value={zipName} onValueChange={setZipName} placeholder="archive" id="zip-name" />
                  <OptionSelect
                    label="Compression level"
                    value={level}
                    onValueChange={setLevel}
                    options={[
                      { value: "0", label: "Store (fastest, no compression)" },
                      { value: "6", label: "Balanced (recommended)" },
                      { value: "9", label: "Maximum (slowest, smallest)" },
                    ]}
                    id="zip-level"
                  />
                </div>
              )}
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                {isCreate ? `Create ZIP (${files.length} files)` : "Extract Archive"}
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel={isCreate ? "Compressing archive…" : "Extracting files…"} />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
      {!isCreate && extractedBlob && entries.length > 1 && wf.status === "done" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => saveBlob(extractedBlob, "extracted-files.zip")}>
            <Download size={14} className="mr-1.5" /> Download extracted copy
          </Button>
        </div>
      )}
    </div>
  );
}
