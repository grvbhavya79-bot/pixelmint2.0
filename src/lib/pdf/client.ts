"use client";

/**
 * Client-side PDF engine: pdf.js for rendering/text + @cantoo/pdf-lib for structure.
 * Everything runs in the user's browser — no uploads.
 */
import * as pdfjs from "pdfjs-dist";

let workerConfigured = false;

export async function getPdfjs() {
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    workerConfigured = true;
  }
  return pdfjs;
}

export async function loadPdfDocument(data: ArrayBuffer, password?: string) {
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(data),
    password,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;
  return doc;
}

export interface RenderedPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
}

/** Render a page to canvas at a given scale. */
export async function renderPdfPage(
  doc: Awaited<ReturnType<typeof loadPdfDocument>>,
  pageNumber: number,
  scale = 2,
): Promise<RenderedPage> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  page.cleanup();
  return { pageNumber, canvas };
}

/** First page thumbnail for previews. */
export async function renderPdfThumbnail(
  data: ArrayBuffer,
  maxSide = 220,
): Promise<{ url: string; width: number; height: number }> {
  const doc = await loadPdfDocument(data.slice(0));
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(maxSide / base.width, maxSide / base.height, 2);
  const { canvas } = await renderPdfPage(doc, 1, Math.max(0.2, scale));
  await doc.destroy();
  return { url: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
}

export interface PdfTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfLine {
  y: number;
  items: PdfTextItem[];
}

/** Extract positioned text items grouped into lines for a page. */
export async function extractPageLines(
  doc: Awaited<ReturnType<typeof loadPdfDocument>>,
  pageNumber: number,
): Promise<PdfLine[]> {
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();
  const items = (content.items as { str: string; transform: number[]; width: number; height: number }[])
    .filter((it) => it.str.trim().length > 0)
    .map((it) => ({
      text: it.str,
      x: it.transform[4],
      y: it.transform[5],
      width: it.width,
      height: Math.abs(it.transform[3]) || 10,
    }));
  page.cleanup();

  const tolerance = 3;
  const lines: PdfLine[] = [];
  for (const item of items.sort((a, b) => b.y - a.y || a.x - b.x)) {
    const line = lines.find((l) => Math.abs(l.y - item.y) <= tolerance);
    if (line) line.items.push(item);
    else lines.push({ y: item.y, items: [item] });
  }
  for (const line of lines) line.items.sort((a, b) => a.x - b.x);
  return lines;
}

/** Simple plain-text extraction for a whole document. */
export async function extractPdfText(doc: Awaited<ReturnType<typeof loadPdfDocument>>): Promise<string[]> {
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const lines = await extractPageLines(doc, p);
    pages.push(lines.map((l) => l.items.map((i) => i.text).join(" ").replace(/\s+/g, " ").trim()).join("\n"));
  }
  return pages;
}

/* --------------------------- pdf-lib helpers ----------------------------- */

import { PDFDocument } from "@cantoo/pdf-lib";

export async function loadPdfLib(data: ArrayBuffer | Uint8Array, options?: { password?: string; ignoreEncryption?: boolean }) {
  return await PDFDocument.load(data, {
    ignoreEncryption: options?.ignoreEncryption ?? true,
    password: options?.password,
    throwOnInvalidObject: false,
    updateMetadata: false,
  });
}

/** Parse "1-3, 5, 8-10" into a sorted unique page list (1-based). */
export function parsePageRanges(input: string, pageCount: number): number[] {
  const pages = new Set<number>();
  for (const part of input.split(/[,;\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    const start = Math.max(1, parseInt(m[1], 10));
    const end = m[2] ? parseInt(m[2], 10) : start;
    const [lo, hi] = start <= end ? [start, end] : [end, start];
    for (let p = lo; p <= Math.min(hi, pageCount); p++) pages.add(p);
  }
  return [...pages].sort((a, b) => a - b);
}

/** Split ranges input into groups: "1-3, 5, 8-10" -> [[1,2,3],[5],[8,9,10]] */
export function parsePageGroups(input: string, pageCount: number): number[][] {
  const groups: number[][] = [];
  for (const part of input.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const start = Math.max(1, parseInt(m[1], 10));
      const end = Math.min(pageCount, parseInt(m[2], 10));
      if (start <= end) {
        groups.push(Array.from({ length: end - start + 1 }, (_, i) => start + i));
        continue;
      }
    }
    const single = parseInt(part, 10);
    if (!Number.isNaN(single) && single >= 1 && single <= pageCount) groups.push([single]);
  }
  return groups;
}
