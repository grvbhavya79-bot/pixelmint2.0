"use client";

/**
 * Shared block-layout PDF renderer (pdf-lib).
 * Used by Text→PDF, Word→PDF, HTML→PDF, PPT→PDF and Excel→PDF.
 */
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "@cantoo/pdf-lib";
import { sanitizeWinAnsi } from "@/lib/format";

export type Align = "left" | "center" | "right";

export interface BlockStyle {
  size: number;
  bold?: boolean;
  italic?: boolean;
  align?: Align;
  spaceBefore?: number;
  spaceAfter?: number;
  color?: [number, number, number];
  indent?: number;
  bullet?: boolean;
}

export type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string; align?: Align }
  | { type: "paragraph"; text: string; align?: Align; indent?: number; bullet?: boolean }
  | { type: "listItem"; text: string; ordered?: boolean; marker?: string }
  | { type: "image"; data: Uint8Array; width: number; height: number }
  | { type: "table"; rows: string[][]; header: boolean }
  | { type: "spacer"; height: number };

export interface PdfDocOptions {
  pageSize?: "a4" | "a4l" | "letter";
  margin?: number; // points
  baseFontSize?: number;
  fontFamily?: "helvetica" | "times" | "courier";
  title?: string;
}

const PAGE_SIZES = { a4: [595.28, 841.89] as const, a4l: [841.89, 595.28] as const, letter: [612, 792] as const };

async function fontsFor(doc: PDFDocument, family: "helvetica" | "times" | "courier") {
  const f = {
    helvetica: {
      regular: StandardFonts.Helvetica,
      bold: StandardFonts.HelveticaBold,
      italic: StandardFonts.HelveticaOblique,
      boldItalic: StandardFonts.HelveticaBoldOblique,
    },
    times: {
      regular: StandardFonts.TimesRoman,
      bold: StandardFonts.TimesRomanBold,
      italic: StandardFonts.TimesRomanItalic,
      boldItalic: StandardFonts.TimesRomanBoldItalic,
    },
    courier: {
      regular: StandardFonts.Courier,
      bold: StandardFonts.CourierBold,
      italic: StandardFonts.CourierOblique,
      boldItalic: StandardFonts.CourierBoldOblique,
    },
  }[family];
  return {
    regular: await doc.embedFont(f.regular),
    bold: await doc.embedFont(f.bold),
    italic: await doc.embedFont(f.italic),
    boldItalic: await doc.embedFont(f.boldItalic),
  };
}

export class PdfLayoutBuilder {
  doc!: PDFDocument;
  page!: PDFPage;
  fonts!: { regular: PDFFont; bold: PDFFont; italic: PDFFont; boldItalic: PDFFont };
  y = 0;
  margin = 56;
  pageSize: [number, number] = [595.28, 841.89];
  base = 11;

  async init(options: PdfDocOptions = {}) {
    this.doc = await PDFDocument.create();
    this.margin = options.margin ?? 56;
    this.base = options.baseFontSize ?? 11;
    this.pageSize = [...PAGE_SIZES[options.pageSize ?? "a4"]] as [number, number];
    this.fonts = await fontsFor(this.doc, options.fontFamily ?? "helvetica");
    this.page = this.doc.addPage(this.pageSize);
    this.y = this.pageSize[1] - this.margin;
    if (options.title) this.doc.setTitle(options.title);
    this.doc.setProducer("ToolBox100");
    this.doc.setCreator("ToolBox100");
  }

  get contentWidth(): number {
    return this.pageSize[0] - this.margin * 2;
  }

  newPage() {
    this.page = this.doc.addPage(this.pageSize);
    this.y = this.pageSize[1] - this.margin;
  }

  ensureSpace(h: number) {
    if (this.y - h < this.margin) this.newPage();
  }

  measure(text: string, size: number, bold?: boolean, italic?: boolean): number {
    const font = bold && italic ? this.fonts.boldItalic : bold ? this.fonts.bold : italic ? this.fonts.italic : this.fonts.regular;
    return font.widthOfTextAtSize(sanitizeWinAnsi(text), size);
  }

  drawText(text: string, x: number, size: number, style: BlockStyle, width: number) {
    const font =
      style.bold && style.italic
        ? this.fonts.boldItalic
        : style.bold
          ? this.fonts.bold
          : style.italic
            ? this.fonts.italic
            : this.fonts.regular;
    const clean = sanitizeWinAnsi(text);
    const color = style.color ? rgb(style.color[0], style.color[1], style.color[2]) : rgb(0.06, 0.09, 0.16);
    if (style.align === "center") {
      const w = font.widthOfTextAtSize(clean, size);
      this.page.drawText(clean, { x: x + (width - w) / 2, y: this.y, size, font, color });
    } else if (style.align === "right") {
      const w = font.widthOfTextAtSize(clean, size);
      this.page.drawText(clean, { x: x + width - w, y: this.y, size, font, color });
    } else {
      this.page.drawText(clean, { x, y: this.y, size, font, color });
    }
  }

  /** Word-wrap text into lines that fit `maxWidth`. */
  wrap(text: string, size: number, maxWidth: number, bold?: boolean, italic?: boolean): string[] {
    const paragraphs = sanitizeWinAnsi(text).split("\n");
    const lines: string[] = [];
    for (const para of paragraphs) {
      if (!para.trim()) {
        lines.push("");
        continue;
      }
      const words = para.split(/\s+/);
      let current = "";
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (this.measure(test, size, bold, italic) <= maxWidth) {
          current = test;
        } else {
          if (current) lines.push(current);
          // Hard-break absurdly long words
          if (this.measure(word, size, bold, italic) > maxWidth) {
            let piece = "";
            for (const ch of word) {
              if (this.measure(piece + ch, size, bold, italic) > maxWidth) {
                lines.push(piece);
                piece = ch;
              } else piece += ch;
            }
            current = piece;
          } else {
            current = word;
          }
        }
      }
      if (current) lines.push(current);
    }
    return lines;
  }

  /** Render one wrapped paragraph block. */
  paragraph(text: string, style: BlockStyle) {
    const size = style.size;
    const indent = style.indent ?? 0;
    const maxWidth = this.contentWidth - indent - (style.bullet ? 14 : 0);
    const lines = this.wrap(text, size, maxWidth, style.bold, style.italic);
    const lineH = size * 1.45;
    this.y -= (style.spaceBefore ?? 0);
    for (const line of lines) {
      this.ensureSpace(lineH);
      this.y -= lineH;
      if (style.bullet) this.drawText("•", this.margin + indent, size, { ...style }, maxWidth);
      this.drawText(line, this.margin + indent + (style.bullet ? 14 : 0), size, style, maxWidth);
    }
    this.y -= (style.spaceAfter ?? size * 0.6);
  }

  /** Render a simple bordered table, paginating rows. */
  table(rows: string[][], opts: { header?: boolean; fontSize?: number } = {}) {
    if (rows.length === 0) return;
    const size = opts.fontSize ?? Math.max(8, this.base - 2);
    const lineH = size * 1.6;
    const padding = 4;
    const cols = Math.max(...rows.map((r) => r.length));
    // Column widths: weight by content length, min 50pt
    const weights = Array.from({ length: cols }, (_, c) =>
      Math.max(...rows.map((r) => (r[c] ?? "").length), 3),
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const widths = weights.map((w) => Math.max(46, (w / totalWeight) * this.contentWidth));
    // Normalize to content width
    const scale = this.contentWidth / widths.reduce((a, b) => a + b, 0);
    const finalWidths = widths.map((w) => w * scale);

    const drawRow = (row: string[], isHeader: boolean, firstRow: boolean) => {
      const cellLines = row.map((cell, i) => this.wrap(cell || " ", size, finalWidths[i] - padding * 2, isHeader));
      const rowHeight = Math.max(...cellLines.map((l) => l.length)) * lineH + padding * 2;
      this.ensureSpace(rowHeight + 2);
      const top = this.y;
      let x = this.margin;
      for (let i = 0; i < cols; i++) {
        const lines = cellLines[i] ?? [];
        let ty = top - padding - lineH;
        for (const line of lines) {
          this.page.drawText(line, {
            x: x + padding,
            y: ty,
            size,
            font: isHeader ? this.fonts.bold : this.fonts.regular,
            color: rgb(0.06, 0.09, 0.16),
          });
          ty -= lineH;
        }
        // borders
        this.page.drawRectangle({
          x,
          y: top - rowHeight,
          width: finalWidths[i],
          height: rowHeight,
          borderColor: rgb(0.82, 0.86, 0.91),
          borderWidth: 0.75,
        });
        if (isHeader) {
          this.page.drawRectangle({
            x,
            y: top - rowHeight,
            width: finalWidths[i],
            height: rowHeight,
            color: rgb(0.94, 0.96, 0.99),
            opacity: 0.6,
          });
        }
        x += finalWidths[i];
      }
      this.y = top - rowHeight;
      void firstRow;
    };

    rows.forEach((row, i) => drawRow(row, Boolean(opts.header) && i === 0, i === 0));
    this.y -= 10;
  }

  async image(pngOrJpeg: Uint8Array, naturalW: number, naturalH: number, maxW?: number) {
    const max = maxW ?? this.contentWidth;
    const scale = Math.min(max / naturalW, (this.pageSize[1] - this.margin * 2) / naturalH, 1);
    const w = naturalW * scale;
    const h = naturalH * scale;
    this.ensureSpace(h + 12);
    this.y -= h + 8;
    const isPng = pngOrJpeg[0] === 0x89 && pngOrJpeg[1] === 0x50;
    const img = isPng ? await this.doc.embedPng(pngOrJpeg) : await this.doc.embedJpg(pngOrJpeg);
    this.page.drawImage(img, { x: this.margin, y: this.y, width: w, height: h });
    this.y -= 6;
  }

  /** Render the standard block model. */
  async blocks(list: Block[]) {
    for (const b of list) {
      if (b.type === "heading") {
        const size = b.level === 1 ? this.base * 1.9 : b.level === 2 ? this.base * 1.5 : this.base * 1.25;
        this.paragraph(b.text, { size, bold: true, align: b.align, spaceBefore: 10, spaceAfter: 6, color: [0.06, 0.09, 0.16] });
      } else if (b.type === "paragraph") {
        this.paragraph(b.text, { size: this.base, align: b.align, indent: b.indent, bullet: b.bullet, spaceAfter: 4 });
      } else if (b.type === "listItem") {
        this.paragraph(b.marker ? `${b.marker} ${b.text}` : b.text, {
          size: this.base,
          indent: 12,
          spaceAfter: 2,
        });
      } else if (b.type === "spacer") {
        this.y -= b.height;
      } else if (b.type === "image") {
        await this.image(b.data, b.width, b.height);
      } else if (b.type === "table") {
        this.table(b.rows, { header: b.header });
      }
    }
  }

  async save(): Promise<Uint8Array> {
    return await this.doc.save({ useObjectStreams: true });
  }
}

/** Convert a subset of HTML into the block model. */
export function htmlToBlocks(html: string): Block[] {
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, "text/html");
  const blocks: Block[] = [];

  const walk = (node: Node, listDepth = 0) => {
    if (node.nodeType === Node.TEXT_NODE) return;
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    // Skip scripts/styles entirely
    if (["script", "style", "noscript", "iframe", "svg"].includes(tag)) return;

    if (/^h[1-6]$/.test(tag)) {
      const level = Math.min(3, parseInt(tag[1], 10)) as 1 | 2 | 3;
      blocks.push({ type: "heading", level, text: el.textContent?.trim() ?? "" });
      return;
    }
    if (tag === "p" || tag === "blockquote") {
      const text = el.textContent?.trim();
      if (text) blocks.push({ type: "paragraph", text, indent: tag === "blockquote" ? 20 : 0 });
      return;
    }
    if (tag === "pre") {
      const text = el.textContent ?? "";
      for (const line of text.split("\n")) {
        blocks.push({ type: "paragraph", text: line || " ", indent: 12 });
      }
      return;
    }
    if (tag === "ul" || tag === "ol") {
      const items = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === "li");
      items.forEach((li, i) => {
        blocks.push({
          type: "listItem",
          text: li.textContent?.trim() ?? "",
          ordered: tag === "ol",
          marker: tag === "ol" ? `${i + 1}.` : "•",
        });
        // nested lists
        Array.from(li.children)
          .filter((c) => ["ul", "ol"].includes(c.tagName.toLowerCase()))
          .forEach((sub) => walk(sub, listDepth + 1));
      });
      blocks.push({ type: "spacer", height: 6 });
      return;
    }
    if (tag === "br") {
      blocks.push({ type: "spacer", height: 8 });
      return;
    }
    if (tag === "hr") {
      blocks.push({ type: "spacer", height: 14 });
      return;
    }
    if (tag === "table") {
      const rows = Array.from(el.querySelectorAll("tr")).map((tr) =>
        Array.from(tr.children).map((td) => td.textContent?.trim() ?? ""),
      );
      if (rows.length) blocks.push({ type: "table", rows, header: !!el.querySelector("th") });
      return;
    }
    if (tag === "img") return; // images inside arbitrary HTML skipped (CSP + reliability)
    // Structural containers: recurse
    Array.from(el.childNodes).forEach((child) => walk(child, listDepth));
    // Block-level elements with direct text
    if (["div", "section", "article", "main", "header", "footer", "span"].includes(tag)) {
      const ownText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent?.trim())
        .filter(Boolean)
        .join(" ");
      if (ownText) blocks.push({ type: "paragraph", text: ownText });
    }
  };

  walk(dom.body);
  if (blocks.length === 0) {
    const text = dom.body.textContent?.trim();
    if (text) blocks.push({ type: "paragraph", text });
  }
  return blocks;
}
