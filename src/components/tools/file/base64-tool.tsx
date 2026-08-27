"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel } from "@/components/tools/shared/tool-runner";
import { OptionSwitch } from "@/components/tools/shared/option-controls";
import { LIMITS, sniffFileType, MIME_BY_TYPE } from "@/lib/file-validate";
import { copyText, saveBlob } from "@/lib/download";
import { trackToolUse } from "@/lib/track";

const EXT_BY_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_BY_TYPE).map(([type, mime]) => {
    switch (type) {
      case "jpeg": return [mime, "jpg"];
      case "docx": return [mime, "docx"];
      default: return [mime, type];
    }
  }),
);

export default function Base64Tool({ mode = "encode" }: { mode?: string }) {
  const isEncode = mode === "encode";
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [urlSafe, setUrlSafe] = useState(false);
  const [asDataUrl, setAsDataUrl] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [resultFile, setResultFile] = useState<{ name: string; blob: Blob } | null>(null);

  const encodeFile = async (file: File) => {
    setError(null);
    if (file.size > LIMITS.base64) {
      setError(`Files up to ${Math.round(LIMITS.base64 / 1024 / 1024)} MB are supported for Base64 encoding.`);
      return;
    }
    const type = await sniffFileType(file);
    const buffer = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    let base64 = btoa(binary);
    if (urlSafe) base64 = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const mime = MIME_BY_TYPE[type];
    const result = asDataUrl ? `data:${mime};base64,${base64}` : base64;
    setInput(`(binary file: ${file.name})`);
    setOutput(result);
    setSourceName(file.name);
    setResultFile(null);
    trackToolUse("base64-encoder");
  };

  const decodeText = () => {
    setError(null);
    setResultFile(null);
    try {
      let clean = input.trim();
      let mime = "text/plain";
      const dataUrlMatch = clean.match(/^data:([^;,]+);base64,([\s\S]*)$/);
      if (dataUrlMatch) {
        mime = dataUrlMatch[1];
        clean = dataUrlMatch[2];
      }
      clean = clean.replace(/^data:[^,]*,/, "");
      // normalize url-safe
      clean = clean.replace(/-/g, "+").replace(/_/g, "/");
      while (clean.length % 4 !== 0) clean += "=";
      const binary = atob(clean.replace(/\s/g, ""));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      // Is it text (UTF-8 decodable without errors)?
      try {
        const decoder = new TextDecoder("utf-8", { fatal: true });
        const text = decoder.decode(bytes);
        if (mime.startsWith("text/") || mime === "application/json" || mime === "text/plain") {
          setOutput(text);
          setResultFile(null);
          trackToolUse("base64-decoder");
          return;
        }
      } catch {
        /* not valid UTF-8 — treat as binary */
      }
      const blob = new Blob([bytes as unknown as BlobPart], { type: mime });
      const ext = EXT_BY_MIME[mime] ?? mime.split("/")[1] ?? "bin";
      setOutput(`(decoded ${blob.size.toLocaleString()} bytes of ${mime} — use the download button)`);
      setResultFile({ name: `decoded.${ext}`, blob });
      setSourceName(`decoded.${ext}`);
      trackToolUse("base64-decoder");
    } catch {
      setError("That doesn't look like valid Base64. Check the input for missing characters or line breaks inside the data.");
    }
  };

  return (
    <div className="space-y-4">
      {isEncode && (
        <>
          <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border bg-card p-4">
            <OptionSwitch label="URL-safe output (-, _)" checked={urlSafe} onCheckedChange={setUrlSafe} id="b64-urlsafe" />
            <OptionSwitch label="Include data: URL prefix" checked={asDataUrl} onCheckedChange={setAsDataUrl} id="b64-dataurl" />
          </div>
          <FileDropzone onFiles={(fs) => fs[0] && void encodeFile(fs[0])} label="Drop a file to Base64-encode it (or type text below)" compact />
        </>
      )}

      <div>
        <label htmlFor="b64-input" className="mb-1.5 block text-[13px] font-medium text-foreground">
          {isEncode ? "Text to encode" : "Base64 to decode"}
        </label>
        <textarea
          id="b64-input"
          value={isEncode && sourceName ? "" : input}
          readOnly={!!sourceName && isEncode}
          onChange={(e) => { setInput(e.target.value); setSourceName(""); }}
          placeholder={isEncode ? "Type or paste text… or drop a file above" : "Paste Base64 — data: URLs are fine too"}
          className="focus-ring min-h-32 w-full resize-y rounded-xl border bg-card p-4 font-mono text-[13px] leading-relaxed placeholder:font-sans placeholder:text-muted-foreground scrollbar-thin"
        />
        {isEncode && sourceName && (
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Upload size={12} /> Encoded from file: <span className="font-medium text-foreground">{sourceName}</span>
          </p>
        )}
      </div>

      {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}

      <div className="flex flex-wrap gap-2.5">
        {isEncode ? (
          <Button
            onClick={() => {
              if (!input.trim()) {
                setError("Enter text or drop a file to encode.");
                return;
              }
              try {
                let b = btoa(unescape(encodeURIComponent(input)));
                if (urlSafe) b = b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
                setOutput(asDataUrl ? `data:text/plain;base64,${b}` : b);
                setResultFile(null);
                trackToolUse("base64-encoder");
              } catch {
                setError("The text could not be encoded.");
              }
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Encode to Base64
          </Button>
        ) : (
          <Button onClick={decodeText} disabled={!input.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Decode from Base64
          </Button>
        )}
      </div>

      {output && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="b64-output" className="text-[13px] font-medium text-foreground">
              Result <span className="font-normal text-muted-foreground">({output.length.toLocaleString()} characters)</span>
            </label>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => void copyText(output).then(() => toast.success("Copied"))}>
                <Copy size={13} className="mr-1" /> Copy
              </Button>
              {resultFile && (
                <Button variant="outline" size="sm" onClick={() => saveBlob(resultFile.blob, resultFile.name)}>
                  <Download size={13} className="mr-1" /> Download {resultFile.name.split(".").pop()?.toUpperCase()}
                </Button>
              )}
            </div>
          </div>
          <output
            id="b64-output"
            className="block max-h-72 w-full overflow-auto rounded-xl border bg-muted/40 p-4 font-mono text-[12px] leading-relaxed break-all whitespace-pre-wrap scrollbar-thin"
            aria-live="polite"
          >
            {output}
          </output>
        </div>
      )}
    </div>
  );
}
