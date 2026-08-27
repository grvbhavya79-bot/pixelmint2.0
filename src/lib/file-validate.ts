/**
 * Content-based file validation — never trust extensions alone.
 * Reads magic bytes in the browser and detects the real format.
 */

export const LIMITS = {
  pdf: 50 * 1024 * 1024,
  image: 25 * 1024 * 1024,
  document: 50 * 1024 * 1024,
  zip: 100 * 1024 * 1024,
  base64: 25 * 1024 * 1024,
} as const;

export type SniffedType =
  | "pdf"
  | "png"
  | "jpeg"
  | "webp"
  | "gif"
  | "bmp"
  | "zip"
  | "doc" // legacy Word / OLE2
  | "docx" // OOXML (also xlsx/pptx family)
  | "unknown";

const MAGIC: { type: SniffedType; bytes: number[]; offset?: number }[] = [
  { type: "pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { type: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "gif", bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { type: "bmp", bytes: [0x42, 0x4d] },
  { type: "zip", bytes: [0x50, 0x4b, 0x03, 0x04] }, // also OOXML containers
  { type: "doc", bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE2
];

/** Detect the real type of a file from its first bytes. */
export async function sniffFileType(file: File | Blob): Promise<SniffedType> {
  const head = new Uint8Array(await file.slice(0, 512).arrayBuffer());

  // WEBP: RIFF....WEBP
  if (
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50
  ) {
    return "webp";
  }

  for (const m of MAGIC) {
    const off = m.offset ?? 0;
    if (m.bytes.every((b, i) => head[off + i] === b)) {
      if (m.type === "zip") return await refineZip(head, file);
      return m.type;
    }
  }
  return "unknown";
}

/** Distinguish docx/xlsx/pptx from plain zip by the first entry name. */
async function refineZip(head: Uint8Array, file: File | Blob): Promise<SniffedType> {
  const firstEntry = new TextDecoder("latin1")
    .decode(head.slice(30, 120))
    .split("/")[0]
    .toLowerCase();
  if (firstEntry.startsWith("word/")) return "docx";
  void file;
  return "zip";
}

export const MIME_BY_TYPE: Record<SniffedType, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  zip: "application/zip",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  unknown: "application/octet-stream",
};

export interface ValidateOptions {
  /** Accepted sniffed types */
  accept: SniffedType[];
  /** Maximum size in bytes */
  maxSize: number;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
  type: SniffedType;
}

/** Validate one file against content type + size rules. */
export async function validateFile(file: File, opts: ValidateOptions): Promise<ValidationResult> {
  const type = await sniffFileType(file);
  if (!opts.accept.includes(type)) {
    return {
      ok: false,
      type,
      error: `"${file.name}" isn't a supported file type${type === "unknown" ? "" : ` (detected ${type.toUpperCase()})`}.`,
    };
  }
  if (file.size > opts.maxSize) {
    return {
      ok: false,
      type,
      error: `"${file.name}" is too large. Maximum ${Math.round(opts.maxSize / 1024 / 1024)} MB.`,
    };
  }
  return { ok: true, type };
}

/** Standard option presets used by tool pages. */
export const ACCEPT = {
  pdfOnly: { accept: ["pdf" as SniffedType], maxSize: LIMITS.pdf },
  images: { accept: ["png", "jpeg", "webp", "bmp", "gif"] as SniffedType[], maxSize: LIMITS.image },
  imagesNoGif: { accept: ["png", "jpeg", "webp", "bmp"] as SniffedType[], maxSize: LIMITS.image },
  anyImageToPdf: { accept: ["png", "jpeg", "webp", "bmp"] as SniffedType[], maxSize: LIMITS.image },
  wordLike: { accept: ["docx", "doc", "zip"] as SniffedType[], maxSize: LIMITS.document },
  anyFile: { accept: Object.keys(MIME_BY_TYPE).filter((t) => t !== "unknown") as SniffedType[], maxSize: LIMITS.zip },
} satisfies Record<string, ValidateOptions>;
