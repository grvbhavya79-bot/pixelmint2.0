/** Browser audit batch A: core PDF tools (10 tests). */
const { chromium, FILES, OUT, results, record, runFileTool, downloadResult, closeTest, pageErrors } = require("./audit-helpers.cjs");
const fs = require("fs");

const PDF_LIB = "/home/z/.npm-global/lib/node_modules/pdf-lib";
const FFLATE = "/home/z/my-project/node_modules/fflate";

(async () => {
  const browser = await chromium.launch();

  // 1. Merge PDF
  try {
    const { page, ctx, label, errors } = await runFileTool(browser, "merge-pdf", ["test-a.pdf", "test-b.pdf"]);
    const p = await downloadResult(page, "merge-output.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    const ok = doc.getPageCount() === 3;
    record("Merge PDF", ok ? "PASS" : "FAIL", `button="${label}", merged → ${doc.getPageCount()} pages (expect 3)${pageErrors(errors).length ? "; ERRORS: " + pageErrors(errors)[0].slice(0, 100) : ""}`);
    await closeTest({ page, ctx });
  } catch (e) { record("Merge PDF", "FAIL", e.message.slice(0, 180)); }

  // 2. Split PDF
  try {
    const { page, ctx, label, errors } = await runFileTool(browser, "split-pdf", ["multi-4.pdf"], {
      beforeClick: async (page) => {
        const range = page.locator('input[placeholder*="range" i], input[placeholder*="1-3" i]').first();
        if (await range.isVisible().catch(() => false)) await range.fill("1-2");
      },
    });
    const p = await downloadResult(page, "split-output.bin");
    const buf = fs.readFileSync(p);
    if (buf.slice(0, 2).toString() === "PK") {
      const { unzipSync } = require(FFLATE);
      const entries = Object.keys(unzipSync(new Uint8Array(buf)));
      record("Split PDF", entries.length >= 1 ? "PASS" : "FAIL", `button="${label}", ZIP with ${entries.length} file(s)`);
    } else {
      const { PDFDocument } = require(PDF_LIB);
      const doc = await PDFDocument.load(buf);
      record("Split PDF", doc.getPageCount() === 2 ? "PASS" : "WARN", `button="${label}", single PDF with ${doc.getPageCount()} page(s)`);
    }
    await closeTest({ page, ctx });
  } catch (e) { record("Split PDF", "FAIL", e.message.slice(0, 180)); }

  // 3. Compress PDF
  try {
    const { page, ctx, label } = await runFileTool(browser, "compress-pdf", ["multi-4.pdf"]);
    const p = await downloadResult(page, "compress-output.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Compress PDF", doc.getPageCount() === 4 ? "PASS" : "FAIL", `button="${label}", ${doc.getPageCount()} pages, ${fs.statSync(p).size}B`);
    await closeTest({ page, ctx });
  } catch (e) { record("Compress PDF", "FAIL", e.message.slice(0, 180)); }

  // 4. PDF to JPG
  try {
    const { page, ctx, label } = await runFileTool(browser, "pdf-to-jpg", ["test-a.pdf"]);
    const p = await downloadResult(page, "pdf-to-jpg.bin");
    const buf = fs.readFileSync(p);
    if (buf.slice(0, 2).toString() === "PK") {
      const { unzipSync } = require(FFLATE);
      const entries = unzipSync(new Uint8Array(buf));
      const names = Object.keys(entries);
      const ok = names.length >= 2 && names.every((n) => /\.jpe?g$/i.test(n)) && entries[names[0]].length > 1000;
      record("PDF to JPG", ok ? "PASS" : "FAIL", `button="${label}", ZIP: ${names.length} JPGs`);
    } else if (buf[0] === 0xff && buf[1] === 0xd8) {
      record("PDF to JPG", "PASS", `button="${label}", single JPG ${buf.length}B (valid JPEG magic)`);
    } else {
      record("PDF to JPG", "FAIL", `button="${label}", unknown output ${buf.length}B`);
    }
    await closeTest({ page, ctx });
  } catch (e) { record("PDF to JPG", "FAIL", e.message.slice(0, 180)); }

  // 5. JPG to PDF
  try {
    const { page, ctx, label } = await runFileTool(browser, "jpg-to-pdf", ["test-image.jpg"]);
    const p = await downloadResult(page, "jpg-to-pdf.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("JPG to PDF", doc.getPageCount() === 1 ? "PASS" : "FAIL", `button="${label}", ${doc.getPageCount()} page(s), ${fs.statSync(p).size}B`);
    await closeTest({ page, ctx });
  } catch (e) { record("JPG to PDF", "FAIL", e.message.slice(0, 180)); }

  // 6. PDF to Word
  try {
    const { page, ctx, label } = await runFileTool(browser, "pdf-to-word", ["test-a.pdf"]);
    const p = await downloadResult(page, "pdf-to-word.docx");
    const buf = fs.readFileSync(p);
    const ok = buf.slice(0, 2).toString() === "PK" && buf.length > 3000;
    let textOk = false;
    if (ok) {
      const { unzipSync } = require(FFLATE);
      const xml = Buffer.from(unzipSync(new Uint8Array(buf))["word/document.xml"]).toString();
      textOk = /Page One|ABCDEFG|ToolBox100/i.test(xml);
    }
    record("PDF to Word", ok && textOk ? "PASS" : ok ? "WARN" : "FAIL", `button="${label}", valid DOCX=${ok}, text extracted=${textOk}`);
    await closeTest({ page, ctx });
  } catch (e) { record("PDF to Word", "FAIL", e.message.slice(0, 180)); }

  // 7. Word to PDF
  try {
    const { page, ctx, label } = await runFileTool(browser, "word-to-pdf", ["test.docx"]);
    const p = await downloadResult(page, "word-to-pdf.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Word to PDF", doc.getPageCount() >= 1 ? "PASS" : "FAIL", `button="${label}", ${doc.getPageCount()} page(s)`);
    await closeTest({ page, ctx });
  } catch (e) { record("Word to PDF", "FAIL", e.message.slice(0, 180)); }

  // 8. Rotate PDF
  try {
    const { page, ctx, label } = await runFileTool(browser, "rotate-pdf", ["multi-4.pdf"]);
    const p = await downloadResult(page, "rotate-output.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Rotate PDF", doc.getPageCount() === 4 ? "PASS" : "FAIL", `button="${label}", ${doc.getPageCount()} pages`);
    await closeTest({ page, ctx });
  } catch (e) { record("Rotate PDF", "FAIL", e.message.slice(0, 180)); }

  // 9. Protect PDF
  try {
    const { page, ctx, label } = await runFileTool(browser, "protect-pdf", ["multi-4.pdf"], {
      beforeClick: async (page) => {
        const pws = page.locator('input[type="password"], input[autocomplete="new-password"]');
        const n = await pws.count();
        for (let i = 0; i < n; i++) await pws.nth(i).fill("auditpw123");
      },
    });
    const p = await downloadResult(page, "protect-output.pdf");
    const { PDFDocument } = require(PDF_LIB);
    let encrypted = false;
    try { await PDFDocument.load(fs.readFileSync(p)); } catch (e) { encrypted = /encrypt|password/i.test(e.message); }
    record("Protect PDF", encrypted ? "PASS" : "WARN", `button="${label}", encrypted=${encrypted}`);
    await closeTest({ page, ctx });
  } catch (e) { record("Protect PDF", "FAIL", e.message.slice(0, 180)); }

  // 10. Unlock PDF (using the encrypted file from test 9)
  try {
    const { page, ctx, label } = await runFileTool(browser, "unlock-pdf", [`${OUT}/protect-output.pdf`], {
      beforeClick: async (page) => {
        const pws = page.locator('input[type="password"], input[placeholder*="password" i]');
        const n = await pws.count();
        for (let i = 0; i < n; i++) await pws.nth(i).fill("auditpw123");
      },
    });
    const p = await downloadResult(page, "unlock-output.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Unlock PDF", doc.getPageCount() === 4 ? "PASS" : "WARN", `button="${label}", decrypted ${doc.getPageCount()} pages`);
    await closeTest({ page, ctx });
  } catch (e) { record("Unlock PDF", "FAIL", e.message.slice(0, 180)); }

  await browser.close();
  const pass = results.filter((r) => r.status === "PASS").length;
  console.log(`\nBATCH A: ${pass}/${results.length} PASS`);
  fs.writeFileSync("/home/z/my-project/scripts/audit-browser-A.json", JSON.stringify(results, null, 2));
  process.exit(results.some((r) => r.status === "FAIL") ? 1 : 0);
})();
