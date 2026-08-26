"use client";

import { zipSync } from "fflate";
import { safeBaseName } from "./format";

/** Save a Blob as a download with a clean filename. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeBaseName(filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export interface ZipEntry {
  name: string;
  blob: Blob;
}

/** Bundle results into a ZIP (built client-side with fflate) and download it. */
export async function saveZip(entries: ZipEntry[], zipName: string, level: 0 | 6 | 9 = 6): Promise<void> {
  const files: Record<string, Uint8Array> = {};
  const used = new Set<string>();
  for (const entry of entries) {
    let name = safeBaseName(entry.name);
    if (used.has(name)) {
      const dot = name.lastIndexOf(".");
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : "";
      let n = 2;
      while (used.has(`${base}-${n}${ext}`)) n++;
      name = `${base}-${n}${ext}`;
    }
    used.add(name);
    files[name] = new Uint8Array(await entry.blob.arrayBuffer());
  }
  const zipped = zipSync(files, { level });
  saveBlob(new Blob([zipped as unknown as BlobPart], { type: "application/zip" }), zipName);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}
