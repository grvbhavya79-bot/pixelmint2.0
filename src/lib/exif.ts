/**
 * Minimal JPEG EXIF reader (client-side, no dependencies).
 * Reads the APP1/Exif segment and decodes common tags including GPS.
 */

export interface ExifEntry {
  tag: string;
  label: string;
  value: string;
}

const TAG_NAMES: Record<number, string> = {
  0x010e: "Image description",
  0x010f: "Camera make",
  0x0110: "Camera model",
  0x0112: "Orientation",
  0x011a: "X resolution",
  0x0132: "Date taken",
  0x0131: "Software",
  0x013b: "Artist",
  0x8298: "Copyright",
  0x829a: "Exposure time",
  0x829d: "F number",
  0x8827: "ISO",
  0x9003: "Date original",
  0x9004: "Date digitized",
  0x920a: "Focal length",
  0xa402: "Exposure mode",
  0xa403: "White balance",
  0xa406: "Scene capture type",
  0x8769: "__ifd_exif",
  0x8825: "__ifd_gps",
};

const GPS_TAGS: Record<number, string> = {
  0x0001: "GPS latitude ref",
  0x0002: "GPS latitude",
  0x0003: "GPS longitude ref",
  0x0004: "GPS longitude",
  0x0006: "GPS altitude",
};

function readUint16(view: DataView, offset: number, little: boolean): number {
  return view.getUint16(offset, little);
}
function readUint32(view: DataView, offset: number, little: boolean): number {
  return view.getUint32(offset, little);
}

function readValue(view: DataView, entry: number, tiffStart: number, little: boolean): string | number | number[] {
  const type = readUint16(view, entry + 2, little);
  const count = readUint32(view, entry + 4, little);
  const sizes: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  const size = (sizes[type] ?? 1) * count;
  const valueOffset = size <= 4 ? entry + 8 : tiffStart + readUint32(view, entry + 8, little);

  try {
    switch (type) {
      case 2: { // ASCII
        let s = "";
        for (let i = 0; i < count - 1 && valueOffset + i < view.byteLength; i++) {
          s += String.fromCharCode(view.getUint8(valueOffset + i));
        }
        return s.trim();
      }
      case 1:
      case 7:
        if (count === 1) return view.getUint8(valueOffset);
        return Array.from({ length: Math.min(count, 8) }, (_, i) => view.getUint8(valueOffset + i));
      case 3:
        if (count === 1) return readUint16(view, valueOffset, little);
        return Array.from({ length: Math.min(count, 8) }, (_, i) => readUint16(view, valueOffset + i * 2, little));
      case 4:
        if (count === 1) return readUint32(view, valueOffset, little);
        return Array.from({ length: Math.min(count, 8) }, (_, i) => readUint32(view, valueOffset + i * 4, little));
      case 5: { // rational
        if (count === 1) {
          const num = readUint32(view, valueOffset, little);
          const den = readUint32(view, valueOffset + 4, little);
          return den === 0 ? num : num / den;
        }
        return Array.from({ length: Math.min(count, 4) }, (_, i) => {
          const num = readUint32(view, valueOffset + i * 8, little);
          const den = readUint32(view, valueOffset + i * 8 + 4, little);
          return den === 0 ? num : num / den;
        });
      }
      default:
        return "";
    }
  } catch {
    return "";
  }
}

function dms(values: number[] | number, ref: string): string {
  if (!Array.isArray(values) || values.length < 3) return "";
  const [d, m, s] = values;
  const decimal = d + m / 60 + s / 3600;
  const signed = ref === "S" || ref === "W" ? -decimal : decimal;
  return `${decimal.toFixed(6)}° ${ref} (${signed.toFixed(6)})`;
}

export function readExif(buffer: ArrayBuffer): ExifEntry[] {
  const view = new DataView(buffer);
  const entries: ExifEntry[] = [];
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return entries;

  let offset = 2;
  let tiffStart = -1;
  while (offset < view.byteLength - 4) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    const size = view.getUint16(offset + 2);
    if (marker === 0xe1) {
      // APP1 — check for Exif header
      const magic = String.fromCharCode(
        view.getUint8(offset + 4), view.getUint8(offset + 5), view.getUint8(offset + 6), view.getUint8(offset + 7),
      );
      if (magic === "Exif") {
        tiffStart = offset + 10;
        break;
      }
    }
    offset += 2 + size;
  }
  if (tiffStart < 0 || tiffStart + 8 > view.byteLength) return entries;

  const little = view.getUint16(tiffStart) === 0x4949;
  const ifdOffset = readUint32(view, tiffStart + 4, little);
  const exifIfdPointer = { offset: -1 };
  const gpsIfdPointer = { offset: -1 };

  const readIfd = (ifdEntryOffset: number, tagMap: Record<number, string>, isGps = false) => {
    const dirStart = tiffStart + ifdEntryOffset;
    if (dirStart + 2 > view.byteLength) return;
    const count = readUint16(view, dirStart, little);
    for (let i = 0; i < count && i < 200; i++) {
      const entry = dirStart + 2 + i * 12;
      if (entry + 12 > view.byteLength) break;
      const tag = readUint16(view, entry, little);
      if (tagMap[tag]) {
        const value = readValue(view, entry, tiffStart, little);
        if (tagMap[tag] === "__ifd_exif" && typeof value === "number") exifIfdPointer.offset = value;
        if (tagMap[tag] === "__ifd_gps" && typeof value === "number") gpsIfdPointer.offset = value;
        let display = "";
        if (isGps && (tag === 0x0002 || tag === 0x0004)) {
          const refTag = tag === 0x0002 ? 0x0001 : 0x0003;
          let ref = "";
          for (let j = 0; j < count && j < 200; j++) {
            const e2 = dirStart + 2 + j * 12;
            if (readUint16(view, e2, little) === refTag) {
              ref = String(readValue(view, e2, tiffStart, little));
            }
          }
          display = dms(value as number[], ref);
        } else if (typeof value === "number") {
          display = formatNumericTag(tag, value);
        } else if (Array.isArray(value)) {
          display = value.join(", ");
        } else {
          display = String(value);
        }
        if (display) entries.push({ tag: tag.toString(16), label: tagMap[tag], value: display });
      }
    }
  };

  readIfd(ifdOffset, TAG_NAMES);
  if (exifIfdPointer.offset > 0) {
    readIfd(exifIfdPointer.offset, {
      0x829a: "Exposure time",
      0x829d: "F number",
      0x8827: "ISO",
      0x9003: "Date original",
      0x9004: "Date digitized",
      0x920a: "Focal length",
      0xa402: "Exposure mode",
      0xa403: "White balance",
      0xa406: "Scene capture type",
    });
  }
  if (gpsIfdPointer.offset > 0) readIfd(gpsIfdPointer.offset, GPS_TAGS, true);

  return entries;
}

function formatNumericTag(tag: number, value: number): string {
  switch (tag) {
    case 0x829a: // exposure
      return value >= 1 ? `${value}s` : `1/${Math.round(1 / value)}s`;
    case 0x829d:
      return `f/${value.toFixed(1)}`;
    case 0x920a:
      return `${Math.round(value)} mm`;
    case 0x0112: {
      const map: Record<number, string> = {
        1: "Normal", 3: "Rotated 180°", 6: "Rotated 90° CW", 8: "Rotated 90° CCW",
        2: "Mirrored", 4: "Mirrored 180°", 5: "Mirrored 90°", 7: "Mirrored 270°",
      };
      return map[value] ?? String(value);
    }
    default:
      return String(value);
  }
}
