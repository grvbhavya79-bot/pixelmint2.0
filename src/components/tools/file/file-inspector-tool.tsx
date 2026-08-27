"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, useFileQueue } from "@/components/tools/shared/tool-runner";
import { sniffFileType } from "@/lib/file-validate";
import { formatBytes } from "@/lib/format";

/** Built-in extension knowledge base for the Extension Checker mode. */
const EXTENSION_DB: Record<string, { name: string; category: string; mime: string; apps: string }> = {
  pdf: { name: "Portable Document Format", category: "Document", mime: "application/pdf", apps: "Adobe Reader, browsers" },
  docx: { name: "Word Open XML Document", category: "Document", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", apps: "Microsoft Word, Google Docs" },
  doc: { name: "Word Binary Document", category: "Document", mime: "application/msword", apps: "Microsoft Word" },
  xlsx: { name: "Excel Open XML Spreadsheet", category: "Spreadsheet", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", apps: "Microsoft Excel, Google Sheets" },
  pptx: { name: "PowerPoint Open XML Presentation", category: "Presentation", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", apps: "Microsoft PowerPoint" },
  txt: { name: "Plain Text", category: "Document", mime: "text/plain", apps: "Any text editor" },
  csv: { name: "Comma-Separated Values", category: "Data", mime: "text/csv", apps: "Excel, Google Sheets" },
  json: { name: "JavaScript Object Notation", category: "Data", mime: "application/json", apps: "Code editors, APIs" },
  xml: { name: "eXtensible Markup Language", category: "Data", mime: "application/xml", apps: "Browsers, editors" },
  zip: { name: "ZIP Archive", category: "Archive", mime: "application/zip", apps: "Windows Explorer, 7-Zip" },
  rar: { name: "RAR Archive", category: "Archive", mime: "application/vnd.rar", apps: "WinRAR, 7-Zip" },
  "7z": { name: "7-Zip Archive", category: "Archive", mime: "application/x-7z-compressed", apps: "7-Zip" },
  jpg: { name: "JPEG Image", category: "Image", mime: "image/jpeg", apps: "Photos, browsers" },
  jpeg: { name: "JPEG Image", category: "Image", mime: "image/jpeg", apps: "Photos, browsers" },
  png: { name: "Portable Network Graphics", category: "Image", mime: "image/png", apps: "Photos, browsers" },
  webp: { name: "WebP Image", category: "Image", mime: "image/webp", apps: "Chrome, Photos" },
  gif: { name: "Graphics Interchange Format", category: "Image", mime: "image/gif", apps: "Browsers, image viewers" },
  svg: { name: "Scalable Vector Graphics", category: "Image", mime: "image/svg+xml", apps: "Browsers, Illustrator" },
  bmp: { name: "Bitmap Image", category: "Image", mime: "image/bmp", apps: "Paint, Photos" },
  ico: { name: "Icon File", category: "Image", mime: "image/x-icon", apps: "Browsers, Windows" },
  mp3: { name: "MPEG Audio Layer III", category: "Audio", mime: "audio/mpeg", apps: "Music players" },
  wav: { name: "Waveform Audio", category: "Audio", mime: "audio/wav", apps: "Audio editors" },
  mp4: { name: "MPEG-4 Video", category: "Video", mime: "video/mp4", apps: "VLC, browsers" },
  mov: { name: "QuickTime Movie", category: "Video", mime: "video/quicktime", apps: "QuickTime, VLC" },
  avi: { name: "Audio Video Interleave", category: "Video", mime: "video/x-msvideo", apps: "VLC" },
  html: { name: "HyperText Markup Language", category: "Web", mime: "text/html", apps: "Browsers, editors" },
  css: { name: "Cascading Style Sheets", category: "Web", mime: "text/css", apps: "Browsers, editors" },
  js: { name: "JavaScript", category: "Code", mime: "text/javascript", apps: "Browsers, Node.js" },
  ts: { name: "TypeScript", category: "Code", mime: "text/typescript", apps: "Code editors, Node.js" },
  py: { name: "Python Script", category: "Code", mime: "text/x-python", apps: "Python" },
  sql: { name: "Structured Query Language", category: "Code", mime: "application/sql", apps: "Database tools" },
  apk: { name: "Android Package", category: "App", mime: "application/vnd.android.package-archive", apps: "Android" },
  exe: { name: "Windows Executable", category: "App", mime: "application/x-msdownload", apps: "Windows" },
  ttf: { name: "TrueType Font", category: "Font", mime: "font/ttf", apps: "OS font managers" },
};

export default function FileInspectorTool({ mode = "size" }: { mode?: string }) {
  const queue = useFileQueue(
    { accept: ["pdf", "png", "jpeg", "webp", "bmp", "gif", "zip", "docx", "doc", "unknown"], maxSize: 2 * 1024 * 1024 * 1024 },
    { multiple: true, images: true },
  );
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const [lookup, setLookup] = useState("");
  const [sniffed, setSniffed] = useState<Record<string, string>>({});

  const onAdd = async (fs: File[]) => {
    await addFiles(fs);
    if (mode === "mime") {
      for (const f of fs) {
        const type = await sniffFileType(f);
        setSniffed((s) => ({ ...s, [f.name + f.size]: type }));
      }
    }
  };

  const totalSize = useMemo(() => files.reduce((s, f) => s + f.file.size, 0), [files]);

  const lookupInfo = useMemo(() => {
    const ext = lookup.trim().replace(/^\./, "").toLowerCase();
    if (!ext) return null;
    return EXTENSION_DB[ext] ?? null;
  }, [lookup]);

  return (
    <div className="space-y-4">
      {mode === "extension" ? (
        <div className="space-y-4">
          <div className="relative mx-auto max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} aria-hidden="true" />
            <input
              type="search"
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="Type an extension, e.g. pdf or .xlsx"
              aria-label="Look up a file extension"
              className="focus-ring h-11 w-full rounded-xl border bg-card pl-10 pr-4 text-sm shadow-card"
            />
          </div>
          {lookup.trim() !== "" && (
            lookupInfo ? (
              <dl className="mx-auto max-w-xl divide-y overflow-hidden rounded-xl border bg-card shadow-card">
                {[
                  ["Extension", `.${lookup.trim().replace(/^\./, "").toLowerCase()}`],
                  ["Format", lookupInfo.name],
                  ["Category", lookupInfo.category],
                  ["MIME type", lookupInfo.mime],
                  ["Typical apps", lookupInfo.apps],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                “{lookup}” is not in the built-in database of {Object.keys(EXTENSION_DB).length} common extensions.
              </p>
            )
          )}
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Popular lookups</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["pdf", "docx", "xlsx", "jpg", "png", "webp", "zip", "mp4", "json", "svg"].map((ext) => (
                <button
                  key={ext}
                  type="button"
                  onClick={() => setLookup(ext)}
                  className="focus-ring rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
                >
                  .{ext}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <FileDropzone onFiles={(fs) => void onAdd(fs)} multiple label={`Drop files to check their ${mode === "size" ? "size" : "MIME type"}`} hint="Nothing is uploaded — inspection happens in your browser" />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files.length > 0 && (
            <>
              <div className="space-y-2">
                {files.map((f) => {
                  const sniff = sniffed[f.file.name + f.file.size];
                  const ext = f.file.name.includes(".") ? f.file.name.split(".").pop()!.toLowerCase() : "";
                  const dbInfo = EXTENSION_DB[ext];
                  const mismatch = sniff && dbInfo && sniff !== "unknown" && dbInfo.mime !== `image/${sniff === "jpeg" ? "jpeg" : sniff}` && !dbInfo.mime.includes(sniff);
                  return (
                    <li key={f.id}>
                      <div className="relative">
                        <FileListRow item={f} onRemove={() => removeFile(f.id)} />
                      </div>
                      {mode === "mime" && (
                        <div className="mt-1 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
                          {sniff ? (
                            <>
                              <p className="text-foreground">
                                <span className="text-muted-foreground">Detected content type:</span>{" "}
                                <span className="font-mono font-semibold">{sniff.toUpperCase()}</span>
                              </p>
                              <p className="text-muted-foreground">
                                Extension .{ext || "?"} claims: <span className="font-mono">{dbInfo?.mime ?? "unknown"}</span>
                                {mismatch && (
                                  <span className="ml-1.5 font-semibold text-destructive">
                                    — mismatch! Content and extension disagree.
                                  </span>
                                )}
                              </p>
                            </>
                          ) : (
                            <p className="text-muted-foreground">Reading file signature…</p>
                          )}
                        </div>
                      )}
                      {mode === "size" && (
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                          <span className="font-mono">{f.file.size.toLocaleString()} bytes</span>
                          <span>= {formatBytes(f.file.size, 2)}</span>
                          <span>= {formatBytes(f.file.size, 4)}</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </div>
              {mode === "size" && files.length > 1 && (
                <div className="rounded-xl border bg-card p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total for {files.length} files</p>
                  <p className="mt-0.5 text-2xl font-bold text-foreground">{formatBytes(totalSize)}</p>
                  <p className="text-xs text-muted-foreground">{totalSize.toLocaleString()} bytes</p>
                </div>
              )}
              <button type="button" onClick={clear} className="focus-ring mx-auto block rounded-md text-xs font-medium text-primary hover:underline">
                Clear all
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
