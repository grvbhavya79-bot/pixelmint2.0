"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionInput, OptionSwitch } from "@/components/tools/shared/option-controls";
import { LIMITS } from "@/lib/file-validate";
import { zipSync } from "fflate";

type CaseMode = "keep" | "lower" | "upper";

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

export default function BatchRenameTool() {
  const queue = useFileQueue(
    { accept: ["pdf", "png", "jpeg", "webp", "bmp", "gif", "zip", "docx", "doc", "unknown"], maxSize: LIMITS.zip },
    { multiple: true },
  );
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("batch-file-renamer");

  const [pattern, setPattern] = useState("file");
  const [startAt, setStartAt] = useState("1");
  const [padWidth, setPadWidth] = useState("2");
  const [caseMode, setCaseMode] = useState<CaseMode>("keep");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [keepExtension, setKeepExtension] = useState(true);
  const [addDate, setAddDate] = useState(false);

  const previews = useMemo(() => {
    return files.map((item, index) => {
      const ext = keepExtension ? (item.file.name.includes(".") ? `.${item.file.name.split(".").pop()}` : "") : "";
      let name = pattern.replace(/\{n\}/g, pad(parseInt(startAt, 10) + index, parseInt(padWidth, 10) || 1));
      if (addDate) name = `${new Date().toISOString().slice(0, 10)}-${name}`;
      if (find) name = name.split(find).join(replace);
      if (caseMode === "lower") name = name.toLowerCase();
      if (caseMode === "upper") name = name.toUpperCase();
      name = name.replace(/[/\\?%*:|"<>\x00-\x1F]/g, "-").trim() || "file";
      return {
        id: item.id,
        original: item.file.name,
        renamed: `${name}${ext}`,
        previewUrl: item.previewUrl,
        size: item.file.size,
      };
    });
  }, [files, pattern, startAt, padWidth, caseMode, find, replace, keepExtension, addDate]);

  const renamedCount = useMemo(
    () => previews.filter((p) => p.original !== p.renamed).length,
    [previews],
  );

  const run = async () => {
    if (files.length === 0) return;
    await wf.run(async () => {
      const zipFiles: Record<string, Uint8Array> = {};
      const used = new Set<string>();
      for (const preview of previews) {
        const blob = files.find((f) => f.id === preview.id)!.file;
        let name = preview.renamed;
        if (used.has(name)) {
          const dot = name.lastIndexOf(".");
          name = dot > 0 ? `${name.slice(0, dot)}-${used.size}${name.slice(dot)}` : `${name}-${used.size}`;
        }
        used.add(name);
        zipFiles[name] = new Uint8Array(await blob.arrayBuffer());
      }
      const zipped = zipSync(zipFiles, { level: 6 });
      return {
        filename: "renamed-files.zip",
        blob: new Blob([zipped as unknown as BlobPart], { type: "application/zip" }),
        originalSize: files.reduce((s, f) => s + f.file.size, 0),
        extra: <p className="mt-3 text-xs text-muted-foreground">{used.size} files renamed and bundled. {renamedCount} names changed.</p>,
      };
    });
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} multiple label="Drop files here to rename in batch" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files.length > 0 && (
            <>
              <ul className="space-y-2">
                {files.map((f) => (
                  <FileListRow key={f.id} item={f} onRemove={() => removeFile(f.id)} />
                ))}
              </ul>

              <div className="space-y-4 rounded-xl border bg-card p-4">
                <OptionInput
                  label="Name pattern"
                  value={pattern}
                  onValueChange={setPattern}
                  hint="Use {n} where the sequence number goes, e.g. photo-{n} or report_{n}_final"
                  id="rn-pattern"
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <OptionInput label="Start at" type="number" value={startAt} onValueChange={setStartAt} min={0} id="rn-start" />
                  <OptionInput label="Number width" type="number" value={padWidth} onValueChange={setPadWidth} min={1} max={6} hint="2 → 01, 02…" id="rn-pad" />
                  <div className="space-y-1.5">
                    <label htmlFor="rn-case" className="text-[13px] font-medium text-foreground">Letter case</label>
                    <select
                      id="rn-case"
                      value={caseMode}
                      onChange={(e) => setCaseMode(e.target.value as CaseMode)}
                      className="focus-ring h-9 w-full rounded-md border bg-background px-2 text-sm"
                    >
                      <option value="keep">Keep as typed</option>
                      <option value="lower">lowercase</option>
                      <option value="upper">UPPERCASE</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <OptionInput label="Find in names" value={find} onValueChange={setFind} placeholder="text to replace" id="rn-find" />
                  <OptionInput label="Replace with" value={replace} onValueChange={setReplace} placeholder="replacement" id="rn-replace" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <OptionSwitch label="Keep file extensions" checked={keepExtension} onCheckedChange={setKeepExtension} id="rn-ext" />
                  <OptionSwitch label="Prefix with today's date" checked={addDate} onCheckedChange={setAddDate} id="rn-date" />
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="border-b bg-muted/50 px-4 py-2 text-xs font-semibold text-foreground">
                  Preview — {renamedCount} of {files.length} names change
                </div>
                <ul className="max-h-56 divide-y overflow-y-auto scrollbar-thin">
                  {previews.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 px-4 py-2 text-xs">
                      <span className="min-w-0 flex-1 truncate text-muted-foreground line-through decoration-muted-foreground/40">{p.original}</span>
                      <span aria-hidden="true" className="text-muted-foreground">→</span>
                      <span className={`min-w-0 flex-1 truncate font-medium ${p.original === p.renamed ? "text-muted-foreground" : "text-foreground"}`}>
                        {p.renamed}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                Rename & Download {files.length} Files
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Renaming files…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={() => { clear(); wf.reset(); }} />}
    </div>
  );
}
