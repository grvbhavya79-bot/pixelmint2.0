/** Browser audit batch B: remaining PDF tools + image tools. */
const { chromium, FILES, OUT, results, record, runFileTool, downloadResult, closeTest } = require("./audit-helpers.cjs");
const fs = require("fs");
const PDF_LIB = "/home/z/.npm-global/lib/node_modules/pdf-lib";
const FFLATE = "/home/z/my-project/node_modules/fflate";
const SHARP = "/home/z/.npm-global/lib/node_modules/sharp";

(async () => {
  const browser = await chromium.launch();

  // 1. PDF to Excel
  try {
    const { page, ctx, label } = await runFileTool(browser, "pdf-to-excel", ["test-a.pdf"]);
    const p = await downloadResult(page, "pdf-to-excel.xlsx");
    const buf = fs.readFileSync(p);
    const ok = buf.slice(0, 2).toString() === "PK" && buf.length > 2000;
    record("PDF to Excel", ok ? "PASS" : "FAIL", `button="${label}", valid XLSX=${ok} (${buf.length}B)`);
    await closeTest({ page, ctx });
  } catch (e) { record("PDF to Excel", "FAIL", e.message.slice(0, 180)); }

  // 2. Excel to PDF
  try {
    const { page, ctx, label } = await runFileTool(browser, "excel-to-pdf", ["test.xlsx"]);
    const p = await downloadResult(page, "excel-to-pdf.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Excel to PDF", doc.getPageCount() >= 1 ? "PASS" : "FAIL", `button="${label}", ${doc.getPageCount()} page(s)`);
    await closeTest({ page, ctx });
  } catch (e) { record("Excel to PDF", "FAIL", e.message.slice(0, 180)); }

  // 3. PDF to PowerPoint
  try {
    const { page, ctx, label } = await runFileTool(browser, "pdf-to-powerpoint", ["test-a.pdf"]);
    const p = await downloadResult(page, "pdf-to-ppt.pptx");
    const buf = fs.readFileSync(p);
    const ok = buf.slice(0, 2).toString() === "PK" && buf.length > 3000;
    record("PDF to PowerPoint", ok ? "PASS" : "FAIL", `button="${label}", valid PPTX=${ok} (${buf.length}B)`);
    await closeTest({ page, ctx });
  } catch (e) { record("PDF to PowerPoint", "FAIL", e.message.slice(0, 180)); }

  // 4. PowerPoint to PDF
  try {
    const { page, ctx, label } = await runFileTool(browser, "powerpoint-to-pdf", ["test.pptx"]);
    const p = await downloadResult(page, "ppt-to-pdf.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("PowerPoint to PDF", doc.getPageCount() >= 1 ? "PASS" : "FAIL", `button="${label}", ${doc.getPageCount()} page(s)`);
    await closeTest({ page, ctx });
  } catch (e) { record("PowerPoint to PDF", "FAIL", e.message.slice(0, 180)); }

  // 5. Delete PDF Pages (delete page 2 of 4 → 3 pages)
  try {
    const { page, ctx, label } = await runFileTool(browser, "delete-pdf-pages", ["multi-4.pdf"], {
      beforeClick: async (page) => {
        const inp = page.locator('#pages-input, input[placeholder*="e.g. 1" i]').first();
        if (await inp.isVisible().catch(() => false)) await inp.fill("2");
      },
    });
    const p = await downloadResult(page, "delete-pages.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Delete PDF Pages", doc.getPageCount() === 3 ? "PASS" : "WARN", `button="${label}", ${doc.getPageCount()} pages (expect 3)`);
    await closeTest({ page, ctx });
  } catch (e) { record("Delete PDF Pages", "FAIL", e.message.slice(0, 180)); }

  // 6. Extract PDF Pages (extract 2-3 → 2 pages)
  try {
    const { page, ctx, label } = await runFileTool(browser, "extract-pdf-pages", ["multi-4.pdf"], {
      beforeClick: async (page) => {
        const inp = page.locator('input[placeholder*="page" i], input[placeholder*="e.g." i]').first();
        if (await inp.isVisible().catch(() => false)) await inp.fill("2-3");
      },
    });
    const p = await downloadResult(page, "extract-pages.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Extract PDF Pages", doc.getPageCount() === 2 ? "PASS" : "WARN", `button="${label}", ${doc.getPageCount()} pages (expect 2)`);
    await closeTest({ page, ctx });
  } catch (e) { record("Extract PDF Pages", "FAIL", e.message.slice(0, 180)); }

  // 7. PDF Watermark
  try {
    const { page, ctx, label } = await runFileTool(browser, "pdf-watermark", ["multi-4.pdf"], {
      beforeClick: async (page) => {
        const inp = page.locator('input[type="text"]').first();
        if (await inp.isVisible().catch(() => false)) await inp.fill("AUDIT");
      },
    });
    const p = await downloadResult(page, "watermark.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("PDF Watermark", doc.getPageCount() === 4 ? "PASS" : "FAIL", `button="${label}", ${doc.getPageCount()} pages`);
    await closeTest({ page, ctx });
  } catch (e) { record("PDF Watermark", "FAIL", e.message.slice(0, 180)); }

  // 8. PDF Page Numbers
  try {
    const { page, ctx, label } = await runFileTool(browser, "pdf-page-numbers", ["multi-4.pdf"]);
    const p = await downloadResult(page, "page-numbers.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("PDF Page Numbers", doc.getPageCount() === 4 ? "PASS" : "FAIL", `button="${label}", ${doc.getPageCount()} pages`);
    await closeTest({ page, ctx });
  } catch (e) { record("PDF Page Numbers", "FAIL", e.message.slice(0, 180)); }

  // 9. PDF Metadata Editor (set title)
  try {
    const { page, ctx, label } = await runFileTool(browser, "pdf-metadata-editor", ["test-a.pdf"], {
      beforeClick: async (page) => {
        const inp = page.locator('input[type="text"], input:not([type])').first();
        if (await inp.isVisible().catch(() => false)) await inp.fill("Audit Title");
      },
    });
    const p = await downloadResult(page, "metadata.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    const title = doc.getTitle();
    record("PDF Metadata Editor", title ? "PASS" : "WARN", `button="${label}", title="${title}"`);
    await closeTest({ page, ctx });
  } catch (e) { record("PDF Metadata Editor", "FAIL", e.message.slice(0, 180)); }

  // 10. Repair PDF (feed a mildly broken PDF: truncated tail)
  try {
    fs.writeFileSync(`${OUT}/broken.pdf`, fs.readFileSync(`${FILES}/multi-4.pdf`).subarray(0, 1400));
    const { page, ctx, label } = await runFileTool(browser, "repair-pdf", [`${OUT}/broken.pdf`]);
    const p = await downloadResult(page, "repair.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Repair PDF", doc.getPageCount() >= 1 ? "PASS" : "WARN", `button="${label}", repaired to ${doc.getPageCount()} page(s)`);
    await closeTest({ page, ctx });
  } catch (e) { record("Repair PDF", "FAIL", e.message.slice(0, 180)); }

  // 11. Sign PDF (typed signature mode)
  try {
    const { page, ctx, label } = await runFileTool(browser, "sign-pdf", ["test-a.pdf"], {
      beforeClick: async (page) => {
        await page.evaluate(() => {
          const btn = [...document.querySelector("main").querySelectorAll("button")].find((b) => b.textContent.trim() === "Type");
          if (btn) btn.click();
        });
        await page.waitForTimeout(500);
        const inp = page.locator('input[placeholder*="name" i], input[placeholder*="signature" i], input[placeholder*="type" i]').first();
        if (await inp.isVisible().catch(() => false)) {
          await inp.fill("Grv Bhavya");
          await page.waitForTimeout(300);
        }
      },
    });
    const p = await downloadResult(page, "signed.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Sign PDF", doc.getPageCount() >= 1 ? "PASS" : "FAIL", `button="${label}", signed ${doc.getPageCount()} page(s), ${fs.statSync(p).size}B`);
    await closeTest({ page, ctx });
  } catch (e) { record("Sign PDF", "FAIL", e.message.slice(0, 180)); }

  // 12. PDF OCR (text PDF → verify text output; tesseract downloads model on first run)
  try {
    const { page, ctx, label } = await runFileTool(browser, "pdf-ocr", ["test-a.pdf"]);
    const p = await downloadResult(page, "ocr.txt");
    const text = fs.readFileSync(p, "utf8");
    const hasText = text.trim().length > 0;
    record("PDF OCR", hasText ? "PASS" : "FAIL", `button="${label}", OCR text ${text.trim().length} chars: "${text.trim().slice(0, 50)}"`);
    await closeTest({ page, ctx });
  } catch (e) { record("PDF OCR", "FAIL", e.message.slice(0, 180)); }

  /* ---------------- IMAGE TOOLS ---------------- */

  // 13. Image Compressor (output format may be webp/png/jpeg — must be valid & smaller)
  try {
    const { page, ctx, label } = await runFileTool(browser, "image-compressor", ["test-image.png"]);
    const p = await downloadResult(page, "compressed.img");
    const sharp = require(SHARP);
    const meta = await sharp(p).metadata();
    const before = fs.statSync(`${FILES}/test-image.png`).size;
    const after = fs.statSync(p).size;
    const ok = meta.width === 400 && ["png", "webp", "jpeg"].includes(meta.format) && after < before;
    record("Image Compressor", ok ? "PASS" : "FAIL", `button="${label}", ${before}→${after}B, ${meta.width}x${meta.height} ${meta.format}`);
    await closeTest({ page, ctx });
  } catch (e) { record("Image Compressor", "FAIL", e.message.slice(0, 180)); }

  // 14. Image Resizer (200x150)
  try {
    const { page, ctx, label } = await runFileTool(browser, "image-resizer", ["test-image.png"], {
      beforeClick: async (page) => {
        const nums = page.locator('main input[type="number"]');
        if ((await nums.count()) >= 2) { await nums.nth(0).fill("200"); await nums.nth(1).fill("150"); }
      },
    });
    const p = await downloadResult(page, "resized.png");
    const sharp = require(SHARP);
    const meta = await sharp(p).metadata();
    record("Image Resizer", meta.width === 200 && meta.height === 150 ? "PASS" : "WARN", `button="${label}", ${meta.width}x${meta.height}`);
    await closeTest({ page, ctx });
  } catch (e) { record("Image Resizer", "FAIL", e.message.slice(0, 180)); }

  // 15. Image Cropper
  try {
    const { page, ctx, label } = await runFileTool(browser, "image-cropper", ["test-image.png"]);
    const p = await downloadResult(page, "cropped.png");
    const sharp = require(SHARP);
    const meta = await sharp(p).metadata();
    record("Image Cropper", meta.width > 0 && meta.height > 0 ? "PASS" : "FAIL", `button="${label}", cropped ${meta.width}x${meta.height}`);
    await closeTest({ page, ctx });
  } catch (e) { record("Image Cropper", "FAIL", e.message.slice(0, 180)); }

  // 16. Image Converter (generic, PNG→WEBP via select)
  try {
    const { page, ctx, label } = await runFileTool(browser, "image-converter", ["test-image.png"], {
      beforeClick: async (page) => {
        const select = page.locator("main select").first();
        if (await select.isVisible().catch(() => false)) {
          const opts = await select.locator("option").allTextContents();
          const webpOpt = opts.find((o) => /webp/i.test(o));
          if (webpOpt) await select.selectOption({ label: webpOpt });
        }
      },
    });
    const p = await downloadResult(page, "converted.img");
    const sharp = require(SHARP);
    const meta = await sharp(p).metadata();
    record("Image Converter", meta.format ? "PASS" : "FAIL", `button="${label}", output format=${meta.format}`);
    await closeTest({ page, ctx });
  } catch (e) { record("Image Converter", "FAIL", e.message.slice(0, 180)); }

  // 17. JPG to PNG (dedicated converter, registry-accept fix verified here)
  try {
    const { page, ctx, label } = await runFileTool(browser, "jpg-to-png", ["test-image.jpg"]);
    const p = await downloadResult(page, "jpg-to-png.png");
    const sharp = require(SHARP);
    const meta = await sharp(p).metadata();
    record("JPG to PNG", meta.format === "png" ? "PASS" : "FAIL", `button="${label}", format=${meta.format}`);
    await closeTest({ page, ctx });
  } catch (e) { record("JPG to PNG", "FAIL", e.message.slice(0, 180)); }

  // 18. PNG to JPG
  try {
    const { page, ctx, label } = await runFileTool(browser, "png-to-jpg", ["test-image.png"]);
    const p = await downloadResult(page, "png-to-jpg.jpg");
    const sharp = require(SHARP);
    const meta = await sharp(p).metadata();
    record("PNG to JPG", meta.format === "jpeg" ? "PASS" : "FAIL", `button="${label}", format=${meta.format}`);
    await closeTest({ page, ctx });
  } catch (e) { record("PNG to JPG", "FAIL", e.message.slice(0, 180)); }

  // 19. WEBP to PNG (create webp first)
  try {
    const sharp = require(SHARP);
    await sharp(`${FILES}/test-image.png`).webp().toFile(`${OUT}/test.webp`);
    const { page, ctx, label } = await runFileTool(browser, "webp-to-png", [`${OUT}/test.webp`]);
    const p = await downloadResult(page, "webp-to-png.png");
    const meta = await sharp(p).metadata();
    record("WEBP to PNG", meta.format === "png" ? "PASS" : "FAIL", `button="${label}", format=${meta.format}`);
    await closeTest({ page, ctx });
  } catch (e) { record("WEBP to PNG", "FAIL", e.message.slice(0, 180)); }

  // 20. Background Remover (green background → transparent)
  try {
    const page = await (await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 950 } })).newPage();
    await page.goto(`${"http://localhost:3000"}/tools/background-remover`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const input = document.querySelector('main input[type="file"]');
      if (!input) return false;
      const k = Object.keys(input).find((k) => k.startsWith("__reactProps$"));
      return k && typeof input[k].onChange === "function";
    });
    await page.waitForTimeout(1200);
    await (await page.$('main input[type="file"]')).setInputFiles(`${FILES}/test-bg.png`);
    // wait for preview img to render and load
    await page.waitForSelector('img[alt="Background removed preview"]');
    await page.waitForFunction(() => {
      const img = document.querySelector('img[alt="Background removed preview"]');
      return img && img.complete && img.naturalWidth > 0 && img.src.startsWith("data:");
    }, undefined, { timeout: 60_000 });
    await page.waitForTimeout(2000);
    // click the workflow trigger button ("Download Transparent PNG")
    await page.evaluate(() => {
      const main = document.querySelector("main");
      const trigger = [...main.querySelectorAll("button")].find((b) => /^download transparent/i.test(b.textContent.trim()));
      if (trigger) trigger.click();
    });
    await page.waitForSelector("text=Your file is ready", { timeout: 60_000 });
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 60_000 }),
      page.evaluate(() => {
        const main = document.querySelector("main");
        const dl = [...main.querySelectorAll("button")].find((b) => /^download/i.test(b.textContent.trim()));
        dl.click();
      }),
    ]);
    const p = `${OUT}/bg-removed.png`;
    await download.saveAs(p);
    const sharp = require(SHARP);
    const { data, info } = await sharp(p).raw().toBuffer({ resolveWithObject: true });
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 40) transparent++;
    const pct = (transparent / (info.width * info.height)) * 100;
    record("Background Remover", pct > 50 ? "PASS" : "WARN", `button=download, ${pct.toFixed(1)}% transparent px (${info.width}x${info.height})`);
    await page.context().close();
  } catch (e) { record("Background Remover", "FAIL", e.message.slice(0, 180)); }

  // 21. Image Blur
  try {
    const { page, ctx, label } = await runFileTool(browser, "image-blur", ["test-image.png"]);
    const p = await downloadResult(page, "blurred.png");
    const sharp = require(SHARP);
    const meta = await sharp(p).metadata();
    record("Image Blur", meta.format === "png" ? "PASS" : "FAIL", `button="${label}", ${meta.format} ${fs.statSync(p).size}B`);
    await closeTest({ page, ctx });
  } catch (e) { record("Image Blur", "FAIL", e.message.slice(0, 180)); }

  // 22. Image Grayscale
  try {
    const { page, ctx, label } = await runFileTool(browser, "image-grayscale", ["test-image.png"]);
    const p = await downloadResult(page, "grayscale.png");
    const sharp = require(SHARP);
    const meta = await sharp(p).metadata();
    record("Image Grayscale", meta.format ? "PASS" : "FAIL", `button="${label}", ${meta.format} ${fs.statSync(p).size}B`);
    await closeTest({ page, ctx });
  } catch (e) { record("Image Grayscale", "FAIL", e.message.slice(0, 180)); }

  // 23. Image Metadata Viewer (no download — inspect output text)
  try {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 950 } })).newPage();
    await page.goto("http://localhost:3000/tools/image-metadata-viewer", { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const input = document.querySelector('main input[type="file"]');
      if (!input) return false;
      const k = Object.keys(input).find((k) => k.startsWith("__reactProps$"));
      return k && typeof input[k].onChange === "function";
    });
    await page.waitForTimeout(1200);
    await (await page.$('main input[type="file"]')).setInputFiles(`${FILES}/test-image.jpg`);
    await page.waitForFunction(() => {
      const t = document.querySelector("main").innerText;
      return /dimension|width|height|format|size/i.test(t) && !/drop .*here/i.test(t.slice(0, 400));
    }, undefined, { timeout: 30_000 });
    const text = await page.evaluate(() => document.querySelector("main").innerText);
    const hasInfo = /400|300|jpeg|png|bytes|KB|MB/i.test(text);
    record("Image Metadata Viewer", hasInfo ? "PASS" : "FAIL", `metadata shown: ${hasInfo}`);
    await page.context().close();
  } catch (e) { record("Image Metadata Viewer", "FAIL", e.message.slice(0, 180)); }

  // 24. Image Metadata Remover
  try {
    const { page, ctx, label } = await runFileTool(browser, "image-metadata-remover", ["test-image.jpg"]);
    const p = await downloadResult(page, "clean.jpg");
    const sharp = require(SHARP);
    const meta = await sharp(p).metadata();
    record("Image Metadata Remover", meta.format === "jpeg" ? "PASS" : "FAIL", `button="${label}", clean ${meta.format} ${fs.statSync(p).size}B`);
    await closeTest({ page, ctx });
  } catch (e) { record("Image Metadata Remover", "FAIL", e.message.slice(0, 180)); }

  // 25. Favicon Generator
  try {
    const { page, ctx, label } = await runFileTool(browser, "favicon-generator", ["test-image.png"]);
    const p = await downloadResult(page, "favicon.zip");
    const buf = fs.readFileSync(p);
    if (buf.slice(0, 2).toString() === "PK") {
      const { unzipSync } = require(FFLATE);
      const entries = Object.keys(unzipSync(new Uint8Array(buf)));
      record("Favicon Generator", entries.length >= 2 ? "PASS" : "WARN", `button="${label}", ZIP: ${entries.join(", ").slice(0, 80)}`);
    } else {
      record("Favicon Generator", "WARN", `button="${label}", single file ${buf.length}B`);
    }
    await closeTest({ page, ctx });
  } catch (e) { record("Favicon Generator", "FAIL", e.message.slice(0, 180)); }

  // 26. PNG to PDF (dedicated, registry-accept fix)
  try {
    const { page, ctx, label } = await runFileTool(browser, "png-to-pdf", ["test-image.png"]);
    const p = await downloadResult(page, "png-to-pdf.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("PNG to PDF", doc.getPageCount() === 1 ? "PASS" : "FAIL", `button="${label}", ${doc.getPageCount()} page(s)`);
    await closeTest({ page, ctx });
  } catch (e) { record("PNG to PDF", "FAIL", e.message.slice(0, 180)); }

  // 27. Images to PDF (mixed: png + jpg)
  try {
    const { page, ctx, label } = await runFileTool(browser, "images-to-pdf", ["test-image.png", "test-image.jpg"]);
    const p = await downloadResult(page, "images-to-pdf.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Images to PDF", doc.getPageCount() === 2 ? "PASS" : "WARN", `button="${label}", ${doc.getPageCount()} page(s) (expect 2)`);
    await closeTest({ page, ctx });
  } catch (e) { record("Images to PDF", "FAIL", e.message.slice(0, 180)); }

  // 28. PDF to PNG
  try {
    const { page, ctx, label } = await runFileTool(browser, "pdf-to-png", ["test-a.pdf"]);
    const p = await downloadResult(page, "pdf-to-png.bin");
    const buf = fs.readFileSync(p);
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      record("PDF to PNG", "PASS", `button="${label}", valid PNG ${buf.length}B`);
    } else if (buf.slice(0, 2).toString() === "PK") {
      const { unzipSync } = require(FFLATE);
      const entries = unzipSync(new Uint8Array(buf));
      const names = Object.keys(entries);
      const pngOk = names.every((n) => /\.png$/i.test(n));
      record("PDF to PNG", pngOk ? "PASS" : "FAIL", `button="${label}", ZIP ${names.length} PNGs`);
    } else {
      record("PDF to PNG", "FAIL", `unknown output ${buf.length}B`);
    }
    await closeTest({ page, ctx });
  } catch (e) { record("PDF to PNG", "FAIL", e.message.slice(0, 180)); }

  await browser.close();
  const pass = results.filter((r) => r.status === "PASS").length;
  const warn = results.filter((r) => r.status === "WARN").length;
  console.log(`\nBATCH B: ${pass} PASS / ${warn} WARN / ${results.length - pass - warn} FAIL`);
  fs.writeFileSync("/home/z/my-project/scripts/audit-browser-B.json", JSON.stringify(results, null, 2));
  process.exit(results.some((r) => r.status === "FAIL") ? 1 : 0);
})();
