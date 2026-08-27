"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { ACCEPT } from "@/lib/file-validate";
import { loadPdfLib } from "@/lib/pdf/client";
import { stripExtension } from "@/lib/format";

export default function PdfProtectTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("protect-pdf");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [allowPrinting, setAllowPrinting] = useState(true);

  const strength = password.length >= 16 ? "strong" : password.length >= 10 ? "good" : password.length >= 6 ? "fair" : "short";

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      if (password.length < 6) throw new Error("Choose a password with at least 6 characters.");
      if (password !== confirm) throw new Error("The two passwords do not match.");
      const doc = await loadPdfLib(await files[0].file.arrayBuffer());
      if (doc.isEncrypted) {
        throw new Error("This PDF is already password protected. Unlock it first to change the password.");
      }
      doc.encrypt({
        userPassword: password,
        ownerPassword: `${password}-owner`,
        permissions: {
          printing: allowPrinting ? "highResolution" : undefined,
          modifying: false,
          copying: false,
          annotating: false,
          fillingForms: true,
          contentAccessibility: true,
          documentAssembly: false,
        },
      });
      const bytes = await doc.save({ useObjectStreams: false });
      return {
        filename: `${stripExtension(files[0].file.name)}-protected.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: files[0].file.size,
        extra: (
          <p className="mt-3 text-xs text-muted-foreground">
            Encrypted with AES. Anyone opening the file must enter your password — store it safely, it cannot be recovered.
          </p>
        ),
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setPassword("");
    setConfirm("");
  };

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void addFiles(fs)} accept="application/pdf,.pdf" label="Drop a PDF here to password-protect" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => removeFile(files[0].id)} />
              <div className="space-y-4 rounded-xl border bg-card p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="protect-pw" className="text-[13px] font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="protect-pw"
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    >
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {password && (
                    <p className="text-xs text-muted-foreground">
                      Password strength: <span className={strength === "short" ? "font-medium text-destructive" : "font-medium text-success"}>{strength}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="protect-pw2" className="text-[13px] font-medium">Confirm password</Label>
                  <Input
                    id="protect-pw2"
                    type={show ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={allowPrinting}
                    onChange={(e) => setAllowPrinting(e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-[rgb(37_99_235)]"
                  />
                  Allow printing with the password
                </label>
              </div>
              <Button onClick={() => void run().catch((e) => toast.error(friendlyError(e)))} disabled={wf.busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto" size="lg">
                <Lock size={15} className="mr-1.5" aria-hidden="true" />
                Protect PDF
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Encrypting PDF…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
