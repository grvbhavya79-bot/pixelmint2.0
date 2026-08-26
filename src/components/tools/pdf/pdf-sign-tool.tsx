"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PenLine, Type as TypeIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDropzone } from "@/components/tools/shared/file-dropzone";
import { ErrorPanel, FileListRow, ProcessingStatus, ResultPanel, friendlyError, useFileQueue, useToolWorkflow } from "@/components/tools/shared/tool-runner";
import { OptionSlider, OptionSwitch } from "@/components/tools/shared/option-controls";
import { ACCEPT, LIMITS, validateFile } from "@/lib/file-validate";
import { loadPdfDocument, loadPdfLib, renderPdfPage } from "@/lib/pdf/client";
import { loadImageFile } from "@/lib/imaging";
import { clamp, stripExtension } from "@/lib/format";
import { cn } from "@/lib/utils";

type SigMode = "draw" | "type" | "upload";

function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 600;
    canvas.height = 240;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  const point = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvasRef.current!.width,
      y: ((e.clientY - rect.top) / rect.height) * canvasRef.current!.height,
    };
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        className="h-36 w-full touch-none rounded-lg border-2 border-dashed border-border bg-white"
        aria-label="Signature drawing area"
        onPointerDown={(e) => {
          drawing.current = true;
          lastPoint.current = point(e);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvasRef.current!.getContext("2d")!;
          const p = point(e);
          if (lastPoint.current) {
            ctx.beginPath();
            ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
          lastPoint.current = p;
        }}
        onPointerUp={() => {
          drawing.current = false;
          lastPoint.current = null;
          onChange(canvasRef.current!.toDataURL("image/png"));
        }}
      />
      <div className="flex justify-between">
        <p className="text-xs text-muted-foreground">Draw your signature with mouse, pen or finger</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const canvas = canvasRef.current!;
            canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
            onChange(null);
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

export default function PdfSignTool() {
  const queue = useFileQueue(ACCEPT.pdfOnly, { multiple: false });
  const { files, addFiles, removeFile, clear, error, setError } = queue;
  const wf = useToolWorkflow("sign-pdf");
  const [mode, setMode] = useState<SigMode>("draw");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [fontStyle, setFontStyle] = useState(0);
  const [pages, setPages] = useState<{ url: string; width: number; height: number }[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pos, setPos] = useState({ x: 0.6, y: 0.12 });
  const [sizePct, setSizePct] = useState(25);
  const [addDate, setAddDate] = useState(true);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const FONT_STYLES = [
    "'Segoe Script', 'Brush Script MT', cursive",
    "'Lucida Handwriting', 'Apple Chancery', cursive",
    "'Courier New', monospace",
  ];

  const makeTypedSignature = useCallback((text: string, style: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 200;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0f172a";
    ctx.font = `64px ${FONT_STYLES[style]}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text || " ", canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL("image/png");
  }, [FONT_STYLES]);

  useEffect(() => {
    if (mode === "type" && typed.trim()) setSignatureUrl(makeTypedSignature(typed, fontStyle));
  }, [typed, fontStyle, mode, makeTypedSignature]);

  const loadPages = async (file: File) => {
    try {
      const doc = await loadPdfDocument(await file.arrayBuffer());
      const rendered: { url: string; width: number; height: number }[] = [];
      const max = Math.min(doc.numPages, 30);
      for (let p = 1; p <= max; p++) {
        const { canvas } = await renderPdfPage(doc, p, 1);
        rendered.push({ url: canvas.toDataURL("image/jpeg", 0.75), width: canvas.width, height: canvas.height });
      }
      await doc.destroy();
      setPages(rendered);
      setPageIndex(0);
    } catch {
      setPages([]);
    }
  };

  const onAdd = async (fs: File[]) => {
    await addFiles(fs);
    if (fs[0]) void loadPages(fs[0]);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !dragRef.current) return;
    const parent = dragRef.current.parentElement!.getBoundingClientRect();
    const x = clamp((e.clientX - parent.left) / parent.width - 0.05, 0, 0.98);
    const y = clamp(1 - (e.clientY - parent.top) / parent.height - 0.03, 0, 0.96);
    setPos({ x, y });
  };

  const run = async () => {
    if (!files[0]) return;
    await wf.run(async () => {
      if (!signatureUrl) throw new Error("Create your signature first.");
      const base = stripExtension(files[0].file.name);
      const pdfBytes = new Uint8Array(await files[0].file.arrayBuffer());

      const doc = await loadPdfLib(pdfBytes);
      const pngResponse = await fetch(signatureUrl);
      const pngBytes = new Uint8Array(await pngResponse.arrayBuffer());
      const embedded = await doc.embedPng(pngBytes);

      const page = doc.getPage(pageIndex);
      const { width, height } = page.getSize();
      const sigWidth = width * (sizePct / 100);
      const sigHeight = (embedded.height / embedded.width) * sigWidth;
      page.drawImage(embedded, {
        x: width * pos.x,
        y: height * pos.y,
        width: sigWidth,
        height: sigHeight,
      });
      if (addDate) {
        const font = await doc.embedFont(await import("@cantoo/pdf-lib").then((m) => m.StandardFonts.Helvetica));
        const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        page.drawText(`Signed on ${dateStr}`, {
          x: width * pos.x,
          y: height * pos.y - 12,
          size: 8,
          font,
        });
      }
      const bytes = await doc.save({ useObjectStreams: true });
      return {
        filename: `${base}-signed.pdf`,
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        originalSize: files[0].file.size,
        extra: <p className="mt-3 text-xs text-muted-foreground">Signature placed on page {pageIndex + 1}. Download and verify placement in your PDF reader.</p>,
      };
    });
  };

  const reset = () => {
    clear();
    wf.reset();
    setPages([]);
    setSignatureUrl(null);
    setTyped("");
  };

  const current = pages[pageIndex];

  return (
    <div className="space-y-4">
      {!wf.result && (
        <>
          <FileDropzone onFiles={(fs) => void onAdd(fs)} accept="application/pdf,.pdf" label="Drop the PDF you want to sign" disabled={wf.busy} />
          {error && <ErrorPanel message={error} onDismiss={() => setError(null)} />}
          {files[0] && (
            <>
              <FileListRow item={files[0]} onRemove={() => { removeFile(files[0].id); setPages([]); }} />

              {/* Signature creation */}
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-3 text-sm font-semibold text-foreground">1. Create your signature</p>
                <div role="tablist" aria-label="Signature method" className="mb-3 inline-flex rounded-lg border bg-background p-0.5">
                  {([
                    { id: "draw", label: "Draw", icon: PenLine },
                    { id: "type", label: "Type", icon: TypeIcon },
                    { id: "upload", label: "Upload", icon: Upload },
                  ] as const).map((tab) => (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={mode === tab.id}
                      onClick={() => { setMode(tab.id); if (tab.id !== "type") setSignatureUrl(null); }}
                      className={cn(
                        "focus-ring flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium",
                        mode === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <tab.icon size={13} /> {tab.label}
                    </button>
                  ))}
                </div>

                {mode === "draw" && <SignaturePad onChange={setSignatureUrl} />}

                {mode === "type" && (
                  <div className="space-y-3">
                    <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type your name" aria-label="Your name for the typed signature" />
                    <div className="flex gap-2">
                      {FONT_STYLES.map((style, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFontStyle(i)}
                          aria-pressed={fontStyle === i}
                          className={cn(
                            "focus-ring flex-1 truncate rounded-lg border px-3 py-2 text-lg text-foreground",
                            fontStyle === i ? "border-primary bg-secondary" : "bg-background",
                          )}
                          style={{ fontFamily: style }}
                        >
                          {typed || "Style"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mode === "upload" && (
                  <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-sm text-muted-foreground hover:border-primary/50">
                    <Upload size={16} /> Upload signature image (PNG with transparency is best)
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const check = await validateFile(f, { accept: ["png", "jpeg"], maxSize: LIMITS.image });
                        if (!check.ok) {
                          toast.error(check.error);
                          return;
                        }
                        const img = await loadImageFile(f);
                        const canvas = document.createElement("canvas");
                        canvas.width = img.width;
                        canvas.height = img.height;
                        canvas.getContext("2d")!.drawImage(img.bitmap as CanvasImageSource, 0, 0);
                        setSignatureUrl(canvas.toDataURL("image/png"));
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Placement */}
              {current && signatureUrl && (
                <div className="rounded-xl border bg-card p-4">
                  <p className="mb-3 text-sm font-semibold text-foreground">2. Place it on the document</p>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <label htmlFor="sign-page" className="text-xs font-medium text-muted-foreground">Page</label>
                    <select
                      id="sign-page"
                      value={pageIndex}
                      onChange={(e) => setPageIndex(parseInt(e.target.value, 10))}
                      className="focus-ring rounded-md border bg-background px-2 py-1.5 text-xs"
                    >
                      {pages.map((_, i) => (
                        <option key={i} value={i}>Page {i + 1}</option>
                      ))}
                    </select>
                    <div className="ml-auto w-40">
                      <OptionSlider label="" value={sizePct} onValueChange={setSizePct} min={10} max={60} unit="%" />
                    </div>
                  </div>
                  <div className="relative mx-auto w-full max-w-md cursor-move select-none overflow-hidden rounded-lg border bg-white shadow-inner" style={{ aspectRatio: `${current.width}/${current.height}` }}>
                    { }
                    <img src={current.url} alt={`Page ${pageIndex + 1} preview`} className="pointer-events-none h-full w-full object-contain" />
                    <div
                      ref={dragRef}
                      role="slider"
                      aria-label="Signature position"
                      aria-valuetext={`x ${Math.round(pos.x * 100)}%, y ${Math.round(pos.y * 100)}%`}
                      tabIndex={0}
                      aria-valuenow={Math.round(pos.x * 100)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowLeft") setPos((p) => ({ ...p, x: clamp(p.x - 0.02, 0, 0.98) }));
                        if (e.key === "ArrowRight") setPos((p) => ({ ...p, x: clamp(p.x + 0.02, 0, 0.98) }));
                        if (e.key === "ArrowUp") setPos((p) => ({ ...p, y: clamp(p.y + 0.02, 0, 0.96) }));
                        if (e.key === "ArrowDown") setPos((p) => ({ ...p, y: clamp(p.y - 0.02, 0, 0.96) }));
                      }}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={() => (dragging.current = false)}
                      className="absolute cursor-move ring-2 ring-primary/70"
                      style={{
                        left: `${pos.x * 100}%`,
                        bottom: `${pos.y * 100}%`,
                        width: `${sizePct}%`,
                      }}
                    >
                      { }
                      <img src={signatureUrl} alt="Signature preview" className="pointer-events-none w-full" draggable={false} />
                    </div>
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground">Drag the signature to position it (arrow keys work too)</p>
                  <div className="mt-3">
                    <OptionSwitch label="Add signing date under the signature" checked={addDate} onCheckedChange={setAddDate} id="sign-date" />
                  </div>
                </div>
              )}

              <Button
                onClick={() => void run().catch((e) => toast.error(friendlyError(e)))}
                disabled={wf.busy || !signatureUrl || !current}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                size="lg"
              >
                <PenLine size={15} className="mr-1.5" aria-hidden="true" />
                Sign & Download PDF
              </Button>
            </>
          )}
        </>
      )}
      <ProcessingStatus status={wf.status} stepLabel="Applying signature…" />
      {wf.error && !wf.result && <ErrorPanel message={wf.error} onDismiss={() => wf.setError(null)} />}
      {wf.result && wf.status === "done" && <ResultPanel result={wf.result} onReset={reset} />}
    </div>
  );
}
