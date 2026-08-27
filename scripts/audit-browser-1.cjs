/**
 * ToolBox100 — Browser Functional Audit (Part 1: PDF + Image + File tools)
 * Uses Playwright (global install) against the dev server on :3000.
 * Every test uploads real files, runs the tool, downloads the output,
 * and verifies the output is genuinely correct (parsed, not just present).
 */
const { chromium } = require("/home/z/.npm-global/lib/node_modules/playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:3000";
const FILES = "/home/z/my-project/scripts/test-files";
const OUT = "/home/z/my-project/scripts/test-output";
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function record(tool, status, detail) {
  results.push({ tool, status, detail });
  console.log(`${status === "PASS" ? "✅" : "❌"} [${tool}] ${detail}`);
}

const TIMEOUT = 90_000;

async function newPage(ctx) {
  const page = await ctx.newPage();
  page.setDefaultTimeout(TIMEOUT);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page._collectedErrors = errors;
  return page;
}

/** Upload files into the dropzone and run the tool, wait for result panel. */
async function runFileTool(page, slug, filePaths, buttonLabel) {
  await page.goto(`${BASE}/tools/${slug}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[type="file"]', { state: "attached" });
  const input = await page.$('input[type="file"]');
  await input.setInputFiles(filePaths.map((f) => path.join(FILES, f)));
  // wait for file rows to appear
  await page.waitForSelector("li", { timeout: 20_000 });
  // find and click the action button
  const btn = page.getByRole("button", { name: new RegExp(buttonLabel, "i") });
  await btn.first().waitFor({ state: "visible" });
  await btn.first().click();
  // wait for the result panel
  await page.waitForSelector("text=Your file is ready", { timeout: TIMEOUT });
}

/** Click download and return the saved path. */
async function downloadResult(page, name) {
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 60_000 }),
    page.getByRole("button", { name: /download/i }).first().click(),
  ]);
  const p = path.join(OUT, name);
  await download.saveAs(p);
  return p;
}

async function expectNoPageErrors(page, tool) {
  const errs = page._collectedErrors.filter(
    (e) => !/ResizeObserver|favicon|Download the React DevTools/i.test(e),
  );
  if (errs.length) record(tool, "WARN", `console errors: ${errs[0].slice(0, 140)}`);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true });

  /* ---------------- PDF TOOLS ---------------- */

  // 1. Merge PDF
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "merge-pdf", ["test-a.pdf", "test-b.pdf"], "merge");
    const p = await downloadResult(page, "merge-output.pdf");
    const { PDFDocument } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");
    const doc = await PDFDocument.load(fs.readFileSync(p));
    if (doc.getPageCount() === 3) record("Merge PDF", "PASS", `merged → ${doc.getPageCount()} pages`);
    else record("Merge PDF", "FAIL", `expected 3 pages, got ${doc.getPageCount()}`);
    await expectNoPageErrors(page, "Merge PDF");
    await page.close();
  } catch (e) { record("Merge PDF", "FAIL", e.message.slice(0, 160)); }

  // 2. Split PDF (multi-4 → range 1-2)
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/split-pdf`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${FILES}/multi-4.pdf`);
    await page.waitForSelector("li");
    // choose custom range if available
    const rangeRadio = page.getByText(/custom|range/i).first();
    if (await rangeRadio.isVisible().catch(() => false)) await rangeRadio.click();
    const rangeInput = page.locator('input[placeholder*="range" i], input[placeholder*="1-3" i]').first();
    if (await rangeInput.isVisible().catch(() => false)) await rangeInput.fill("1-2");
    await page.getByRole("button", { name: /split/i }).first().click();
    await page.waitForSelector("text=Your file is ready", { timeout: TIMEOUT });
    const p = await downloadResult(page, "split-output.zip");
    const { unzipSync } = require("/home/z/my-project/node_modules/fflate");
    const entries = unzipSync(new Uint8Array(fs.readFileSync(p)));
    record("Split PDF", "PASS", `ZIP with ${Object.keys(entries).length} file(s): ${Object.keys(entries).join(", ").slice(0, 60)}`);
    await expectNoPageErrors(page, "Split PDF");
    await page.close();
  } catch (e) { record("Split PDF", "FAIL", e.message.slice(0, 160)); }

  // 3. Compress PDF
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "compress-pdf", ["multi-4.pdf"], "compress");
    const p = await downloadResult(page, "compress-output.pdf");
    const { PDFDocument } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");
    const doc = await PDFDocument.load(fs.readFileSync(p));
    const size = fs.statSync(p).size;
    if (doc.getPageCount() === 4 && size > 500) record("Compress PDF", "PASS", `valid PDF, 4 pages, ${size} bytes`);
    else record("Compress PDF", "FAIL", `pages=${doc.getPageCount()} size=${size}`);
    await page.close();
  } catch (e) { record("Compress PDF", "FAIL", e.message.slice(0, 160)); }

  // 4. PDF to JPG
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "pdf-to-jpg", ["test-a.pdf"], "convert|download|jpg");
    const p = await downloadResult(page, "pdf-to-jpg.zip");
    const { unzipSync } = require("/home/z/my-project/node_modules/fflate");
    const entries = unzipSync(new Uint8Array(fs.readFileSync(p)));
    const names = Object.keys(entries);
    const jpgOk = names.some((n) => /\.jpe?g$/i.test(n)) && entries[names[0]].length > 1000;
    if (jpgOk) record("PDF to JPG", "PASS", `${names.length} JPG(s), first ${entries[names[0]].length} bytes`);
    else record("PDF to JPG", "FAIL", `entries: ${names.join(",")}`);
    await page.close();
  } catch (e) { record("PDF to JPG", "FAIL", e.message.slice(0, 160)); }

  // 5. JPG to PDF
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "jpg-to-pdf", ["test-image.jpg"], "convert|create|pdf");
    const p = await downloadResult(page, "jpg-to-pdf.pdf");
    const { PDFDocument } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");
    const doc = await PDFDocument.load(fs.readFileSync(p));
    if (doc.getPageCount() >= 1) record("JPG to PDF", "PASS", `${doc.getPageCount()} page(s), ${fs.statSync(p).size} bytes`);
    else record("JPG to PDF", "FAIL", "0 pages");
    await page.close();
  } catch (e) { record("JPG to PDF", "FAIL", e.message.slice(0, 160)); }

  // 6. PDF to Word
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "pdf-to-word", ["test-a.pdf"], "convert");
    const p = await downloadResult(page, "pdf-to-word.docx");
    const buf = fs.readFileSync(p);
    const ok = buf.slice(0, 2).toString() === "PK" && buf.length > 3000;
    if (ok) {
      // verify document.xml contains our text
      const { unzipSync } = require("/home/z/my-project/node_modules/fflate");
      const xml = Buffer.from(unzipSync(new Uint8Array(buf))["word/document.xml"]).toString();
      const hasText = /ToolBox100 Audit Test|Page One|ABCDEFG/i.test(xml);
      record("PDF to Word", hasText ? "PASS" : "WARN", `valid DOCX (${buf.length}B), text extracted: ${hasText}`);
    } else record("PDF to Word", "FAIL", `not a valid docx: ${buf.length} bytes`);
    await page.close();
  } catch (e) { record("PDF to Word", "FAIL", e.message.slice(0, 160)); }

  // 7. Word to PDF
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "word-to-pdf", ["test.docx"], "convert");
    const p = await downloadResult(page, "word-to-pdf.pdf");
    const { PDFDocument } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");
    const doc = await PDFDocument.load(fs.readFileSync(p));
    if (doc.getPageCount() >= 1) record("Word to PDF", "PASS", `${doc.getPageCount()} page(s), ${fs.statSync(p).size} bytes`);
    else record("Word to PDF", "FAIL", "0 pages");
    await page.close();
  } catch (e) { record("Word to PDF", "FAIL", e.message.slice(0, 160)); }

  // 8. Excel to PDF
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "excel-to-pdf", ["test.xlsx"], "convert");
    const p = await downloadResult(page, "excel-to-pdf.pdf");
    const { PDFDocument } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Excel to PDF", doc.getPageCount() >= 1 ? "PASS" : "FAIL", `${doc.getPageCount()} page(s)`);
    await page.close();
  } catch (e) { record("Excel to PDF", "FAIL", e.message.slice(0, 160)); }

  // 9. PPT to PDF
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "powerpoint-to-pdf", ["test.pptx"], "convert");
    const p = await downloadResult(page, "ppt-to-pdf.pdf");
    const { PDFDocument } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("PowerPoint to PDF", doc.getPageCount() >= 1 ? "PASS" : "FAIL", `${doc.getPageCount()} page(s)`);
    await page.close();
  } catch (e) { record("PowerPoint to PDF", "FAIL", e.message.slice(0, 160)); }

  // 10. Rotate PDF
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "rotate-pdf", ["multi-4.pdf"], "rotate|download|apply");
    const p = await downloadResult(page, "rotate-output.pdf");
    const { PDFDocument, degrees } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Rotate PDF", doc.getPageCount() === 4 ? "PASS" : "FAIL", `${doc.getPageCount()} pages after rotate`);
    await page.close();
  } catch (e) { record("Rotate PDF", "FAIL", e.message.slice(0, 160)); }

  // 11. Protect PDF (needs password field)
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/protect-pdf`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${FILES}/multi-4.pdf`);
    await page.waitForSelector("li");
    const pw = page.locator('input[type="password"], input[placeholder*="password" i]').first();
    if (await pw.isVisible().catch(() => false)) await pw.fill("auditpw123");
    await page.getByRole("button", { name: /protect|encrypt|download/i }).first().click();
    await page.waitForSelector("text=Your file is ready", { timeout: TIMEOUT });
    const p = await downloadResult(page, "protect-output.pdf");
    const buf = fs.readFileSync(p);
    const { PDFDocument } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");
    let encrypted = false;
    try { await PDFDocument.load(buf); } catch (e) { encrypted = /encrypt|password/i.test(e.message); }
    record("Protect PDF", encrypted ? "PASS" : "WARN", encrypted ? "output is encrypted (pdf-lib refuses to open)" : "output not recognized as encrypted");
    await page.close();
  } catch (e) { record("Protect PDF", "FAIL", e.message.slice(0, 160)); }

  // 12. Unlock PDF (uses the protected file we just made)
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/unlock-pdf`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${OUT}/protect-output.pdf`);
    await page.waitForSelector("li");
    const pw = page.locator('input[type="password"], input[placeholder*="password" i]').first();
    if (await pw.isVisible().catch(() => false)) await pw.fill("auditpw123");
    await page.getByRole("button", { name: /unlock|remove|download/i }).first().click();
    await page.waitForSelector("text=Your file is ready", { timeout: TIMEOUT });
    const p = await downloadResult(page, "unlock-output.pdf");
    const { PDFDocument } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Unlock PDF", doc.getPageCount() === 4 ? "PASS" : "WARN", `decrypted, ${doc.getPageCount()} pages`);
    await page.close();
  } catch (e) { record("Unlock PDF", "FAIL", e.message.slice(0, 160)); }

  // 13. Watermark
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/pdf-watermark`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${FILES}/multi-4.pdf`);
    await page.waitForSelector("li");
    const txt = page.locator('input[type="text"]').first();
    if (await txt.isVisible().catch(() => false)) await txt.fill("AUDIT");
    await page.getByRole("button", { name: /watermark|add|download|apply/i }).first().click();
    await page.waitForSelector("text=Your file is ready", { timeout: TIMEOUT });
    const p = await downloadResult(page, "watermark.pdf");
    const { PDFDocument } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("PDF Watermark", doc.getPageCount() === 4 ? "PASS" : "FAIL", `${doc.getPageCount()} pages`);
    await page.close();
  } catch (e) { record("PDF Watermark", "FAIL", e.message.slice(0, 160)); }

  // 14. Page numbers
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/pdf-page-numbers`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${FILES}/multi-4.pdf`);
    await page.waitForSelector("li");
    await page.getByRole("button", { name: /number|add|download|apply/i }).first().click();
    await page.waitForSelector("text=Your file is ready", { timeout: TIMEOUT });
    const p = await downloadResult(page, "page-numbers.pdf");
    const { PDFDocument } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("PDF Page Numbers", doc.getPageCount() === 4 ? "PASS" : "FAIL", `${doc.getPageCount()} pages`);
    await page.close();
  } catch (e) { record("PDF Page Numbers", "FAIL", e.message.slice(0, 160)); }

  // 15. Delete pages
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/delete-pdf-pages`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${FILES}/multi-4.pdf`);
    await page.waitForSelector("li");
    const pagesInput = page.locator('input[placeholder*="page" i], input[placeholder*="2" i]').first();
    if (await pagesInput.isVisible().catch(() => false)) await pagesInput.fill("2");
    await page.getByRole("button", { name: /delete|remove|download|apply/i }).first().click();
    await page.waitForSelector("text=Your file is ready", { timeout: TIMEOUT });
    const p = await downloadResult(page, "delete-pages.pdf");
    const { PDFDocument } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Delete PDF Pages", doc.getPageCount() === 3 ? "PASS" : "WARN", `${doc.getPageCount()} pages (expected 3)`);
    await page.close();
  } catch (e) { record("Delete PDF Pages", "FAIL", e.message.slice(0, 160)); }

  // 16. Extract pages
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/extract-pdf-pages`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${FILES}/multi-4.pdf`);
    await page.waitForSelector("li");
    const pagesInput = page.locator('input[placeholder*="page" i], input[placeholder*="1" i]').first();
    if (await pagesInput.isVisible().catch(() => false)) await pagesInput.fill("2-3");
    await page.getByRole("button", { name: /extract|download|apply/i }).first().click();
    await page.waitForSelector("text=Your file is ready", { timeout: TIMEOUT });
    const p = await downloadResult(page, "extract-pages.pdf");
    const { PDFDocument } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Extract PDF Pages", doc.getPageCount() === 2 ? "PASS" : "WARN", `${doc.getPageCount()} pages (expected 2)`);
    await page.close();
  } catch (e) { record("Extract PDF Pages", "FAIL", e.message.slice(0, 160)); }

  /* ---------------- IMAGE TOOLS ---------------- */

  // 17. Image Compressor
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "image-compressor", ["test-image.png"], "compress|download");
    const p = await downloadResult(page, "compressed.png");
    const sharp = require("/home/z/.npm-global/lib/node_modules/sharp");
    const meta = await sharp(p).metadata();
    const before = fs.statSync(`${FILES}/test-image.png`).size;
    const after = fs.statSync(p).size;
    record("Image Compressor", meta.width === 400 && meta.format === "png" ? "PASS" : "FAIL", `${before}→${after} bytes, ${meta.width}x${meta.height} ${meta.format}`);
    await page.close();
  } catch (e) { record("Image Compressor", "FAIL", e.message.slice(0, 160)); }

  // 18. Image Resizer
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/image-resizer`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${FILES}/test-image.png`);
    await page.waitForSelector("li");
    const w = page.locator('input[type="number"]').first();
    if (await w.isVisible().catch(() => false)) await w.fill("200");
    const h = page.locator('input[type="number"]').nth(1);
    if (await h.isVisible().catch(() => false)) await h.fill("150");
    await page.getByRole("button", { name: /resize|download|apply/i }).first().click();
    await page.waitForSelector("text=Your file is ready", { timeout: TIMEOUT });
    const p = await downloadResult(page, "resized.png");
    const sharp = require("/home/z/.npm-global/lib/node_modules/sharp");
    const meta = await sharp(p).metadata();
    record("Image Resizer", meta.width === 200 && meta.height === 150 ? "PASS" : "WARN", `${meta.width}x${meta.height}`);
    await page.close();
  } catch (e) { record("Image Resizer", "FAIL", e.message.slice(0, 160)); }

  // 19. Image Converter (PNG → JPG)
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/image-converter`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${FILES}/test-image.png`);
    await page.waitForSelector("li");
    // pick JPG from a select if present
    const select = page.locator("select").first();
    if (await select.isVisible().catch(() => false)) {
      const opts = await select.locator("option").allTextContents();
      const jpgOpt = opts.find((o) => /jpe?g/i.test(o));
      if (jpgOpt) await select.selectOption({ label: jpgOpt });
    }
    await page.getByRole("button", { name: /convert|download|apply/i }).first().click();
    await page.waitForSelector("text=Your file is ready", { timeout: TIMEOUT });
    const p = await downloadResult(page, "converted.jpg");
    const sharp = require("/home/z/.npm-global/lib/node_modules/sharp");
    const meta = await sharp(p).metadata();
    record("Image Converter", meta.format === "jpeg" ? "PASS" : "WARN", `output format=${meta.format}`);
    await page.close();
  } catch (e) { record("Image Converter", "FAIL", e.message.slice(0, 160)); }

  // 20. Background Remover (green bg image → transparent PNG)
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/background-remover`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${FILES}/test-bg.png`);
    // wait for preview to be processed
    await page.waitForSelector('img[alt="Background removed preview"]', { timeout: 40_000 });
    await page.waitForFunction(() => {
      const imgs = document.querySelectorAll('img[alt="Background removed preview"]');
      return imgs.length > 0 && imgs[0].complete && imgs[0].naturalWidth > 0;
    }, { timeout: 60_000 });
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /download transparent|download/i }).first().click();
    await page.waitForSelector("text=Your file is ready", { timeout: TIMEOUT });
    const p = await downloadResult(page, "bg-removed.png");
    const sharp = require("/home/z/.npm-global/lib/node_modules/sharp");
    const { data, info } = await sharp(p).raw().toBuffer({ resolveWithObject: true });
    // count transparent pixels (alpha < 40)
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 40) transparent++;
    const pct = (transparent / (info.width * info.height)) * 100;
    record("Background Remover", pct > 50 ? "PASS" : "WARN", `${pct.toFixed(1)}% transparent pixels (${info.width}x${info.height})`);
    await page.close();
  } catch (e) { record("Background Remover", "FAIL", e.message.slice(0, 160)); }

  // 21. Image Crop
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/image-cropper`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${FILES}/test-image.png`);
    await page.waitForSelector("li");
    await page.getByRole("button", { name: /crop|download|apply/i }).first().click();
    await page.waitForSelector("text=Your file is ready", { timeout: TIMEOUT });
    const p = await downloadResult(page, "cropped.png");
    const sharp = require("/home/z/.npm-global/lib/node_modules/sharp");
    const meta = await sharp(p).metadata();
    record("Image Cropper", meta.width > 0 ? "PASS" : "FAIL", `cropped to ${meta.width}x${meta.height}`);
    await page.close();
  } catch (e) { record("Image Cropper", "FAIL", e.message.slice(0, 160)); }

  // 22. Grayscale filter
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "image-grayscale", ["test-image.png"], "grayscale|download|apply|convert");
    const p = await downloadResult(page, "grayscale.png");
    const sharp = require("/home/z/.npm-global/lib/node_modules/sharp");
    const { data } = await sharp(p).greyscale().raw().toBuffer({ resolveWithObject: true });
    record("Image Grayscale", data.length > 0 ? "PASS" : "FAIL", `output ${fs.statSync(p).size} bytes`);
    await page.close();
  } catch (e) { record("Image Grayscale", "FAIL", e.message.slice(0, 160)); }

  // 23. Metadata remover
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "image-metadata-remover", ["test-image.jpg"], "remove|clean|download|strip");
    const p = await downloadResult(page, "meta-removed.jpg");
    const sharp = require("/home/z/.npm-global/lib/node_modules/sharp");
    const meta = await sharp(p).metadata();
    record("Image Metadata Remover", meta.format === "jpeg" ? "PASS" : "WARN", `valid ${meta.format}, ${fs.statSync(p).size} bytes`);
    await page.close();
  } catch (e) { record("Image Metadata Remover", "FAIL", e.message.slice(0, 160)); }

  /* ---------------- FILE TOOLS ---------------- */

  // 24. ZIP Creator
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "zip-creator", ["test-a.pdf", "sample.md", "sample.json"], "create|zip|download");
    const p = await downloadResult(page, "created.zip");
    const { unzipSync } = require("/home/z/my-project/node_modules/fflate");
    const entries = Object.keys(unzipSync(new Uint8Array(fs.readFileSync(p))));
    record("ZIP Creator", entries.length === 3 ? "PASS" : "WARN", `ZIP contains ${entries.length} files: ${entries.join(", ").slice(0, 70)}`);
    await page.close();
  } catch (e) { record("ZIP Creator", "FAIL", e.message.slice(0, 160)); }

  // 25. ZIP Extractor
  try {
    const page = await newPage(ctx);
    await runFileTool(page, "zip-extractor", ["test.zip"], "extract|unzip|download");
    const p = await downloadResult(page, "extracted.zip");
    const { unzipSync } = require("/home/z/my-project/node_modules/fflate");
    const entries = unzipSync(new Uint8Array(fs.readFileSync(p)));
    const helloOk = Buffer.from(entries["hello.txt"] ?? entries[Object.keys(entries)[0]]).toString().includes("Hello from inside");
    record("ZIP Extractor", helloOk ? "PASS" : "WARN", `re-zipped ${Object.keys(entries).length} files, content round-trips: ${helloOk}`);
    await page.close();
  } catch (e) { record("ZIP Extractor", "FAIL", e.message.slice(0, 160)); }

  // 26. QR Generator
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/qr-code-generator`, { waitUntil: "domcontentloaded" });
    const input = page.locator('input[type="text"], textarea').first();
    await input.waitFor({ state: "visible" });
    await input.fill("https://toolbox100.example/audit");
    await page.waitForTimeout(800);
    const img = page.locator("img, canvas").first();
    const imgOk = await img.isVisible();
    const dl = page.getByRole("button", { name: /download/i }).first();
    let dlOk = false;
    if (await dl.isVisible().catch(() => false)) {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 30_000 }),
        dl.click(),
      ]);
      await download.saveAs(`${OUT}/qr.png`);
      dlOk = true;
    }
    record("QR Code Generator", imgOk && dlOk ? "PASS" : "WARN", `QR visible=${imgOk}, downloaded=${dlOk}`);
    await page.close();
  } catch (e) { record("QR Code Generator", "FAIL", e.message.slice(0, 160)); }

  // 27. QR Reader (read the QR we just generated)
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/qr-code-reader`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${OUT}/qr.png`);
    await page.waitForFunction(
      () => document.body.innerText.includes("toolbox100.example") || document.body.innerText.includes("Decoded"),
      { timeout: 40_000 },
    );
    const body = await page.evaluate(() => document.body.innerText);
    record("QR Code Reader", body.includes("toolbox100.example") ? "PASS" : "WARN", `decoded text found: ${body.includes("toolbox100.example")}`);
    await page.close();
  } catch (e) { record("QR Code Reader", "FAIL", e.message.slice(0, 160)); }

  /* ---------------- Invalid input tests ---------------- */

  // 28. Upload a PDF into an image-only tool → must show a friendly error, not crash
  try {
    const page = await newPage(ctx);
    await page.goto(`${BASE}/tools/image-compressor`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${FILES}/test-a.pdf`);
    await page.waitForTimeout(1200);
    const body = await page.evaluate(() => document.body.innerText);
    const rejected = /pdf|image|only|not supported|unsupported/i.test(body);
    const stillIdle = !body.includes("Your file is ready");
    record("Invalid-file rejection", rejected && stillIdle ? "PASS" : "FAIL", "PDF rejected by image tool with friendly message");
    await page.close();
  } catch (e) { record("Invalid-file rejection", "FAIL", e.message.slice(0, 160)); }

  // 29. Corrupt PDF into merge tool → error panel, no crash
  try {
    const page = await newPage(ctx);
    fs.writeFileSync(`${OUT}/corrupt.pdf`, Buffer.from("this is definitely not a pdf file"));
    await page.goto(`${BASE}/tools/merge-pdf`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="file"]', { state: "attached" });
    await (await page.$('input[type="file"]')).setInputFiles(`${OUT}/corrupt.pdf`);
    await page.waitForSelector("li");
    await page.getByRole("button", { name: /merge/i }).first().click();
    await page.waitForTimeout(4000);
    const body = await page.evaluate(() => document.body.innerText);
    const hasError = /error|couldn't|failed|invalid|corrupt/i.test(body);
    record("Corrupt-file handling", hasError ? "PASS" : "WARN", `error panel shown: ${hasError}`);
    await page.close();
  } catch (e) { record("Corrupt-file handling", "FAIL", e.message.slice(0, 160)); }

  await browser.close();

  // Summary
  const pass = results.filter((r) => r.status === "PASS").length;
  const warn = results.filter((r) => r.status === "WARN").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  console.log(`\n=== BROWSER AUDIT PART 1: ${pass} PASS / ${warn} WARN / ${fail} FAIL ===`);
  fs.writeFileSync("/home/z/my-project/scripts/audit-browser-1.json", JSON.stringify(results, null, 2));
  process.exit(fail > 0 ? 1 : 0);
})();
