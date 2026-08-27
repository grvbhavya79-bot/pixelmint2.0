"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfLib } from "@/lib/pdf/client";
import { stripExtension } from "@/lib/format";

export default function PdfMetadataTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("pdf-metadata-editor");
  const [meta, setMeta] = useState({ title: "", author: "", subject: "", keywords: "", creator: "", producer: "" });
  const [original, setOriginal] = useState<Record<string, string>>({});

  const loadMeta = async (file: File) => {
    try {
      const doc = await loadPdfLib(await file.arrayBuffer());
      const values = {
        title: doc.getTitle() ?? "",
        author: doc.getAuthor() ?? "",
        subject: doc.getSubject() ?? "",
        keywords: (doc.getKeywords() as unknown as string) ?? "",
        creator: doc.getCreator() ?? "",
        producer: doc.getProducer() ?? "",
      };
      setMeta(values);
      setOriginal(values);
    } catch {
      /* handled by run */
    }
  };

  const run = async (mode: "save" | "strip") => {
    if (!files[0]) return;
    await wf.run(async () => {
      const doc = await loadPdfLib(await files[0].file.arrayBuffer());
      const dates = {
        created: doc.getCreationDate(),
        modified: doc.getModificationDate(),
      };
      if (mode === "strip") {
        doc.setTitle("");
        doc.setAuthor("");
        doc.setSubject("");
        doc.setKeywords([]);
        doc.setCreator("");
        doc.setProducer("");
      } else {
        doc.setTitle(meta.title);
        doc.setAuthor(meta.author);
        doc.setSubject(meta.subject);
        doc.setKeywords(meta.keywords.split(/[,;]\s*/).filter(Boolean));
        doc.setCreator(meta.creator || "ToolBox100");
      }
      if (dates.created) doc.setCreationDate(dates.created);
      if (dates.modified) doc.setModificationDate(new Date());
      const bytes = await doc.save({ useObjectStreams: true });
      return {
        filename: `${stripExtension(files[0].file.name)}-metadata-${mode === "strip" ? "removed" : "edited"}.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: files[0].file.size,
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            {mode === "strip"
              ? "All metadata fields cleared from the document."
              : "Metadata updated — original values were: " + (original.title || original.author || "empty")}
          </p>
        ),
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setMeta({ title: "", author: "", subject: "", keywords: "", creator: "", producer: "" });
  };

  const fields: { key: keyof typeof meta; label: string; placeholder: string }[] = [
    { key: "title", label: "Title", placeholder: "Document title" },
    { key: "author", label: "Author", placeholder: "Author name" },
    { key: "subject", label: "Subject", placeholder: "What the document is about" },
    { key: "keywords", label: "Keywords", placeholder: "comma, separated, keywords" },
    { key: "creator", label: "Creator", placeholder: "Creating application" },
  ];

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs).then(() => fs[0] && loadMeta(fs[0]))} accept="application/pdf,.pdf" label="Drop a PDF to view and edit its metadata" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <div className="space-y-3 rounded-xl border bg-card p-4">
                {fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={`meta-${field.key}`} className="text-[13px] font-medium">{field.label}</Label>
                    <Input
                      id={`meta-${field.key}`}
                      value={meta[field.key]}
                      onChange={(e) => setMeta((m) => ({ ...m, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
                <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Current producer:</span> {meta.producer || "not set"} · Dates are preserved automatically.
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button onClick={() => void run("save").catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                  Save Metadata
                </Button>
                <Button onClick={() => void run("strip").catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} variant="outline" size="lg">
                  Remove All Metadata
                </Button>
              </div>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Writing metadata…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
