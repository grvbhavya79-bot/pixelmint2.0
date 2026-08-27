/**
 * Create real test files for the functional audit.
 * Outputs to /home/z/my-project/scripts/test-files/
 */
import { mkdirSync, writeFileSync } from "fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const DIR = "/home/z/my-project/scripts/test-files";
mkdirSync(DIR, { recursive: true });

// --- Test PDF 1: two pages with text ---
{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.addPage([595, 842]);
  p1.drawText("ToolBox100 Audit Test — Page One", { x: 60, y: 760, size: 20, font, color: rgb(0.1, 0.1, 0.3) });
  p1.drawText("Hello from the production audit. This line has letters to extract: ABCDEFG 12345.", { x: 60, y: 720, size: 12, font });
  const p2 = doc.addPage([595, 842]);
  p2.drawText("Page Two — second page for split/merge testing.", { x: 60, y: 760, size: 16, font });
  writeFileSync(`${DIR}/test-a.pdf`, await doc.save());
}

// --- Test PDF 2: single page ---
{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const p = doc.addPage([595, 842]);
  p.drawText("Second document (test-b).", { x: 60, y: 760, size: 14, font });
  writeFileSync(`${DIR}/test-b.pdf`, await doc.save());
}

// --- Test PDF 3: 4 pages, used for split/rotate/page-ops ---
{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 4; i++) {
    const p = doc.addPage([595, 842]);
    p.drawText(`Multi-page doc — page ${i} of 4`, { x: 60, y: 760, size: 18, font });
  }
  writeFileSync(`${DIR}/multi-4.pdf`, await doc.save());
}

// --- Real PNG image (solid + shape) built with sharp ---
{
  const sharp = (await import("sharp")).default;
  const svg = Buffer.from(
    `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#ffffff"/>
      <rect x="100" y="60" width="200" height="150" fill="#2563eb" rx="12"/>
      <text x="200" y="150" font-family="sans-serif" font-size="28" fill="#ffffff" text-anchor="middle">TEST</text>
    </svg>`,
  );
  await sharp(svg).png().toFile(`${DIR}/test-image.png`);
  await sharp(svg).jpeg({ quality: 90 }).toFile(`${DIR}/test-image.jpg`);
  // image with plain green background (for bg-remover)
  const svgBg = Buffer.from(
    `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="300" fill="#22c55e"/>
      <circle cx="150" cy="150" r="80" fill="#f59e0b"/>
    </svg>`,
  );
  await sharp(svgBg).png().toFile(`${DIR}/test-bg.png`);
}

// --- Minimal real DOCX (Office Open XML) ---
{
  const docx = await import("docx");
  const d = new docx.Document({
    sections: [{ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Hello DOCX audit. This is a real Word document." })] })] }],
  });
  const buf = await docx.Packer.toBuffer(d);
  writeFileSync(`${DIR}/test.docx`, buf);
}

// --- Minimal real XLSX with exceljs ---
{
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  ws.addRow(["Name", "Amount"]);
  ws.addRow(["Alpha", 100]);
  ws.addRow(["Beta", 250]);
  const buf = await wb.xlsx.writeBuffer();
  writeFileSync(`${DIR}/test.xlsx`, Buffer.from(buf));
}

// --- Minimal real PPTX with pptxgenjs ---
{
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  slide.addText("Audit slide 1", { x: 1, y: 1, fontSize: 24 });
  pptx.writeFile({ fileName: `${DIR}/test.pptx` });
}

// --- Real ZIP with fflate ---
{
  const { zipSync, strToU8 } = await import("fflate");
  const zipped = zipSync({
    "hello.txt": strToU8("Hello from inside the ZIP audit file."),
    "nested/data.txt": strToU8("nested content 42"),
  });
  writeFileSync(`${DIR}/test.zip`, zipped);
}

// --- Text/markdown/json/sql fixtures ---
writeFileSync(`${DIR}/sample.md`, "# Heading\n\nThis is **markdown** with `code`.\n\n- item one\n- item two\n");
writeFileSync(`${DIR}/sample.json`, `{"name":"audit","version":1,"nested":{"ok":true,"list":[1,2,3]}}`);
writeFileSync(`${DIR}/sample.sql`, "select id,name from users where created_at > '2026-01-01' order by id desc;");

console.log("Test files created:", require("fs").readdirSync(DIR).join(", "));
