"use client";

/**
 * Canvas-based image engine — all processing happens locally in the browser.
 */

export interface LoadedImage {
  bitmap: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
}

export async function loadImageFile(file: File | Blob): Promise<LoadedImage> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      return { bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not decode this image."));
      el.src = url;
    });
    return { bitmap: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

export function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Your browser could not create a canvas.");
  return { canvas, ctx };
}

export function drawToCanvas(image: LoadedImage, width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const { canvas, ctx } = createCanvas(width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image.bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

export type OutputFormat = "png" | "jpeg" | "webp" | "bmp" | "gif";

export const MIME_BY_FORMAT: Record<OutputFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  bmp: "image/bmp",
  gif: "image/gif",
};

export async function canvasToBlob(canvas: HTMLCanvasElement, format: OutputFormat, quality = 0.9): Promise<Blob> {
  if (format === "bmp") return encodeBMP(canvas);
  if (format === "gif") return encodeGIF(canvas);
  const mime = MIME_BY_FORMAT[format];
  // Safari fallback: canvas.toBlob callback style
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), mime, quality);
  });
  if (!blob) throw new Error("Image export failed in your browser.");
  if (blob.type !== mime && format !== "png") {
    // Browser didn't support target (e.g. old Safari + webp)
    return await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b ?? new Blob()), "image/png");
    });
  }
  return blob;
}

/* ------------------------------ BMP encoder ------------------------------ */
/** Minimal, spec-correct uncompressed 24/32-bit BMP writer (BITMAPINFOHEADER). */
export function encodeBMP(canvas: HTMLCanvasElement): Blob {
  const { width, height } = canvas;
  const ctx = canvas.getContext("2d")!;
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const rowSize = width * 3;
  const padding = (4 - (rowSize % 4)) % 4;
  const pixelBytes = (rowSize + padding) * height;
  const buffer = new ArrayBuffer(54 + pixelBytes);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  // File header
  bytes[0] = 0x42; bytes[1] = 0x4d; // "BM"
  view.setUint32(2, buffer.byteLength, true);
  view.setUint32(10, 54, true);
  // Info header
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelBytes, true);
  view.setUint32(38, 2835, true);
  view.setUint32(42, 2835, true);
  let p = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = rgba[i + 3] / 255;
      // composite on white for 24-bit BMP
      bytes[p++] = Math.round(rgba[i + 2] * a + 255 * (1 - a));
      bytes[p++] = Math.round(rgba[i + 1] * a + 255 * (1 - a));
      bytes[p++] = Math.round(rgba[i] * a + 255 * (1 - a));
    }
    p += padding;
  }
  return new Blob([buffer], { type: "image/bmp" });
}

/* ------------------------------ GIF encoder ------------------------------ */
/**
 * Single-frame GIF89a encoder with real LZW compression.
 * Pure, dependency-free and correct — produces a standard static GIF.
 */
export function encodeGIF(canvas: HTMLCanvasElement): Blob {
  const { width, height } = canvas;
  const ctx = canvas.getContext("2d")!;
  const rgba = ctx.getImageData(0, 0, width, height).data;

  // --- Build a palette (median-cut-lite: uniform 6x7x6 = 252 colors + B/W) ---
  const rLevels = [0, 51, 102, 153, 204, 255];
  const gLevels = [0, 36, 72, 109, 145, 182, 218, 255];
  const palette: number[][] = [];
  for (const r of rLevels) for (const g of gLevels) for (const b of rLevels) palette.push([r, g, b]);
  palette.push([255, 255, 255]); // 252
  // 254 & 255 reserved

  const total = width * height;
  const indices = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2], a = rgba[i * 4 + 3];
    if (a < 128) {
      indices[i] = 252; // transparent-ish → white
      continue;
    }
    const rq = rLevels[Math.min(5, Math.round(r / 51))];
    const gq = gLevels[Math.min(7, Math.round(g / 36.428))];
    const bq = rLevels[Math.min(5, Math.round(b / 51))];
    indices[i] = rq === 255 && gq === 255 && bq === 255 ? 251 : (rq / 51) * 48 + (gq / 36.428) * 6 + bq / 51 | 0;
    // compute exact index from quantized levels
    const ri = rLevels.indexOf(rq), gi = gLevels.indexOf(gq), bi = rLevels.indexOf(bq);
    indices[i] = ri * 48 + gi * 6 + bi;
  }

  const bytes: number[] = [];
  const push = (...b: number[]) => bytes.push(...b);
  const pushShort = (n: number) => push(n & 0xff, (n >> 8) & 0xff);

  // Header + logical screen descriptor
  push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61); // GIF89a
  pushShort(width);
  pushShort(height);
  push(0xf7, 0, 0); // global color table, 256 colors
  // Global color table
  for (let i = 0; i < 256; i++) {
    const [r, g, b] = palette[Math.min(i, palette.length - 1)];
    push(r, g, b);
  }
  // Graphic control extension (no transparency)
  push(0x21, 0xf9, 4, 0x00, 0, 0, 0, 0);
  // Image descriptor
  push(0x2c);
  pushShort(0);
  pushShort(0);
  pushShort(width);
  pushShort(height);
  push(0);

  // LZW
  const minCodeSize = 8;
  push(minCodeSize);
  const clearCode = 256;
  const eoiCode = 257;
  let codeSize = minCodeSize + 1;
  let dict = new Map<string, number>();
  let dictSize = 258;

  const out: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;
  const emit = (code: number) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      out.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  };

  let prefix = "";
  const resetDict = () => {
    dict = new Map();
    dictSize = 258;
    codeSize = 9;
  };
  resetDict();
  emit(clearCode);
  for (let i = 0; i < indices.length; i++) {
    const c = indices[i];
    const cs = String.fromCharCode(c);
    const combo = prefix + cs;
    if (prefix === "" || dict.has(combo)) {
      prefix = combo;
    } else {
      emit(prefix.length === 1 ? prefix.charCodeAt(0) : dict.get(prefix)!);
      dict.set(combo, dictSize++);
      if (dictSize - 1 === 1 << codeSize && codeSize < 12) codeSize++;
      if (dictSize >= 4096) {
        emit(clearCode);
        resetDict();
      }
      prefix = cs;
    }
  }
  if (prefix !== "") emit(prefix.length === 1 ? prefix.charCodeAt(0) : dict.get(prefix)!);
  emit(eoiCode);
  if (bitCount > 0) out.push(bitBuffer & 0xff);

  // Write LZW data in 255-byte sub-blocks
  for (let i = 0; i < out.length; i += 255) {
    const chunk = out.slice(i, i + 255);
    push(chunk.length, ...chunk);
  }
  push(0); // end of image data
  push(0x3b); // trailer

  return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
}

/* ------------------------------ Filters ---------------------------------- */

export function applyCssFilter(
  image: LoadedImage,
  filters: {
    brightness?: number; // 100 = normal
    contrast?: number;
    saturate?: number;
    blur?: number; // px
    grayscale?: number; // 0-100
    sepia?: number; // 0-100
    invert?: number; // 0-100
  },
): HTMLCanvasElement {
  const parts: string[] = [];
  if (filters.brightness !== undefined) parts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== undefined) parts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturate !== undefined) parts.push(`saturate(${filters.saturate}%)`);
  if (filters.blur) parts.push(`blur(${filters.blur}px)`);
  if (filters.grayscale) parts.push(`grayscale(${filters.grayscale}%)`);
  if (filters.sepia) parts.push(`sepia(${filters.sepia}%)`);
  if (filters.invert) parts.push(`invert(${filters.invert}%)`);
  const { canvas, ctx } = createCanvas(image.width, image.height);
  ctx.filter = parts.join(" ") || "none";
  ctx.drawImage(image.bitmap as CanvasImageSource, 0, 0);
  ctx.filter = "none";
  return canvas;
}

/** Unsharp mask sharpening on raw pixels. */
export function sharpenCanvas(
  canvas: HTMLCanvasElement,
  amount = 80, // 0-200
  radius = 1, // px
): HTMLCanvasElement {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const src = ctx.getImageData(0, 0, width, height);
  const out = ctx.createImageData(width, height);
  const k = Math.max(0, amount / 50); // strength multiplier
  const r = Math.max(1, Math.round(radius));
  const src32 = new Uint32Array(src.data.buffer.slice(0));
  const out32 = new Uint32Array(out.data.buffer);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (let dy = -r; dy <= r; dy++) {
        const yy = Math.min(height - 1, Math.max(0, y + dy));
        for (let dx = -r; dx <= r; dx++) {
          if (dx === 0 && dy === 0) continue;
          const xx = Math.min(width - 1, Math.max(0, x + dx));
          const px = src32[yy * width + xx];
          sumR += px & 0xff;
          sumG += (px >> 8) & 0xff;
          sumB += (px >> 16) & 0xff;
          count++;
        }
      }
      const center = src32[y * width + x];
      const cr = center & 0xff, cg = (center >> 8) & 0xff, cb = (center >> 16) & 0xff, ca = (center >>> 24) & 0xff;
      const n = count || 1;
      const fr = Math.round(cr + k * (cr - sumR / n));
      const fg = Math.round(cg + k * (cg - sumG / n));
      const fb = Math.round(cb + k * (cb - sumB / n));
      out32[y * width + x] =
        (ca << 24) |
        (Math.min(255, Math.max(0, fb)) << 16) |
        (Math.min(255, Math.max(0, fg)) << 8) |
        Math.min(255, Math.max(0, fr));
    }
  }
  ctx.putImageData(out, 0, 0);
  void src32;
  return canvas;
}

export function imageToDataUrl(bitmap: ImageBitmap | HTMLImageElement, width: number, height: number, type = "image/png"): string {
  const { canvas, ctx } = createCanvas(width, height);
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
  return canvas.toDataURL(type);
}
