/** Browser audit batch C: file, document/text, developer tools + generators (UI-level). */
const { chromium, FILES, OUT, results, record, runFileTool, downloadResult, closeTest } = require("./audit-helpers.cjs");
const fs = require("fs");
const FFLATE = "/home/z/my-project/node_modules/fflate";
const PDF_LIB = "/home/z/.npm-global/lib/node_modules/pdf-lib";
const SHARP = "/home/z/.npm-global/lib/node_modules/sharp";

const BASE = "http://localhost:3000";

async function newPage(browser) {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);
  await page.goto(BASE, { waitUntil: "domcontentloaded" }).catch(() => {});
  return { page, ctx };
}

/** Generic text-tool runner: fill first textarea, click a button, read textareas + <output> elements. */
async function runTextTool(browser, slug, input, buttonRegex) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(45_000);
  await page.goto(`${BASE}/tools/${slug}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => {
    const ta = document.querySelector("main textarea");
    if (!ta) return false;
    const k = Object.keys(ta).find((k) => k.startsWith("__reactProps$"));
    return k && typeof ta[k].onChange === "function";
  });
  await page.waitForTimeout(800);
  const ta = page.locator("main textarea").first();
  await ta.fill(input);
  await page.waitForTimeout(400);
  let clicked = null;
  if (buttonRegex) {
    clicked = await page.evaluate((reSrc) => {
      const re = new RegExp(reSrc, "i");
      const main = document.querySelector("main");
      const btns = [...main.querySelectorAll("button")].filter((b) => re.test(b.textContent.trim()) && !b.disabled && b.offsetParent !== null);
      if (btns.length) { btns[0].click(); return btns[0].textContent.trim(); }
      return null;
    }, buttonRegex).catch(() => null);
    if (!clicked) {
      // fallback: primary action button
      clicked = await page.evaluate(() => {
        const main = document.querySelector("main");
        const btns = [...main.querySelectorAll("button")].filter((b) => /(^|\s)bg-primary(\s|$)/.test(b.className) && !b.disabled && b.offsetParent !== null);
        if (btns.length) { btns[btns.length - 1].click(); return btns[btns.length - 1].textContent.trim(); }
        return null;
      }).catch(() => null);
    }
  }
  await page.waitForTimeout(1200);
  const out = await page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      textareas: [...main.querySelectorAll("textarea")].map((t) => t.value),
      outputs: [...main.querySelectorAll("output")].map((o) => o.textContent),
      text: main.innerText,
    };
  });
  out.clicked = clicked;
  await ctx.close();
  return out;
}


/** Textarea → file tool: fill textarea, click primary button, wait for result panel. */
async function runTextareaTool(browser, slug, text) {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);
  await page.goto(`${BASE}/tools/${slug}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => {
    const ta = document.querySelector("main textarea");
    if (!ta) return false;
    const k = Object.keys(ta).find((k) => k.startsWith("__reactProps$"));
    return k && typeof ta[k].onChange === "function";
  });
  await page.waitForTimeout(1000);
  await page.locator("main textarea").first().fill(text);
  await page.waitForTimeout(500);
  const label = await page.evaluate(() => {
    const main = document.querySelector("main");
    const btns = [...main.querySelectorAll("button")].filter((b) => /(^|\s)bg-primary(\s|$)/.test(b.className) && !b.disabled && b.offsetParent !== null);
    if (!btns.length) return null;
    const btn = btns[btns.length - 1];
    btn.click();
    return btn.textContent.trim();
  });
  if (!label) throw new Error("no primary action button");
  await page.waitForSelector("text=Your file is ready", { timeout: 70_000 });
  return { page, ctx, label };
}

(async () => {
  const browser = await chromium.launch();

  /* ---------------- FILE TOOLS ---------------- */

  // 1. ZIP Creator
  try {
    const { page, ctx, label } = await runFileTool(browser, "zip-creator", ["test-a.pdf", "sample.md", "sample.json"]);
    const p = await downloadResult(page, "created.zip");
    const { unzipSync } = require(FFLATE);
    const entries = Object.keys(unzipSync(new Uint8Array(fs.readFileSync(p))));
    record("ZIP Creator", entries.length === 3 ? "PASS" : "WARN", `button="${label}", ZIP: ${entries.join(", ").slice(0, 70)}`);
    await closeTest({ page, ctx });
  } catch (e) { record("ZIP Creator", "FAIL", e.message.slice(0, 180)); }

  // 2. ZIP Extractor
  try {
    const { page, ctx, label } = await runFileTool(browser, "zip-extractor", ["test.zip"]);
    const p = await downloadResult(page, "extracted.zip");
    const { unzipSync } = require(FFLATE);
    const entries = unzipSync(new Uint8Array(fs.readFileSync(p)));
    const names = Object.keys(entries);
    const helloOk = names.some((n) => Buffer.from(entries[n]).toString().includes("Hello from inside"));
    record("ZIP Extractor", helloOk ? "PASS" : "WARN", `button="${label}", re-zipped ${names.length} files, content intact=${helloOk}`);
    await closeTest({ page, ctx });
  } catch (e) { record("ZIP Extractor", "FAIL", e.message.slice(0, 180)); }

  // 3. File Compressor
  try {
    const { page, ctx, label } = await runFileTool(browser, "file-compressor", ["test-a.pdf"]);
    const p = await downloadResult(page, "file-compressed.zip");
    const { unzipSync } = require(FFLATE);
    const entries = unzipSync(new Uint8Array(fs.readFileSync(p)));
    const names = Object.keys(entries);
    const ok = names.length >= 1;
    record("File Compressor", ok ? "PASS" : "FAIL", `button="${label}", ZIP ${names.length} file(s)`);
    await closeTest({ page, ctx });
  } catch (e) { record("File Compressor", "FAIL", e.message.slice(0, 180)); }

  // 4. Batch File Renamer (pattern rename — verify the preview list updates)
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/batch-file-renamer`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const i = document.querySelector('main input[type=file]');
      return i && Object.keys(i).some(k => k.startsWith('__reactProps$'));
    });
    await page.waitForTimeout(1200);
    await (await page.$('main input[type=file]')).setInputFiles([`${FILES}/test-a.pdf`, `${FILES}/test-b.pdf`]);
    await page.waitForFunction(() => document.querySelector("main").innerText.includes("test-a.pdf"));
    // fill a rename pattern if present
    const pat = page.locator('main input[type="text"]').first();
    if (await pat.isVisible().catch(() => false)) {
      await pat.fill("doc-{n}");
      await page.waitForTimeout(600);
    }
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const hasPreview = /doc-|rename|preview|new name/i.test(body);
    record("Batch File Renamer", hasPreview ? "PASS" : "WARN", `preview/rename UI active: ${hasPreview}`);
    await ctx.close();
  } catch (e) { record("Batch File Renamer", "FAIL", e.message.slice(0, 180)); }

  // 5-6. File Size / MIME Checker
  for (const [slug, name, expect] of [
    ["file-size-checker", "File Size Checker", /1\.2|KB|bytes/i],
    ["mime-type-checker", "MIME Type Checker", /pdf|application\/pdf/i],
  ]) {
    try {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/tools/${slug}`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => {
        const i = document.querySelector('main input[type=file]');
        return i && Object.keys(i).some(k => k.startsWith('__reactProps$'));
      });
      await page.waitForTimeout(1200);
      await (await page.$('main input[type=file]')).setInputFiles(`${FILES}/test-a.pdf`);
      await page.waitForFunction(() => /pdf|KB|bytes/i.test(document.querySelector("main").innerText) && !/drop .*here/i.test(document.querySelector("main").innerText.slice(0, 400)), undefined, { timeout: 30_000 });
      const body = await page.evaluate(() => document.querySelector("main").innerText);
      const ok = expect.test(body) && body.includes("test-a.pdf");
      record(name, ok ? "PASS" : "FAIL", `inspected file info: ${ok}`);
      await ctx.close();
    } catch (e) { record(name, "FAIL", e.message.slice(0, 180)); }
  }

  // 7. File Extension Checker (extension database — search for .pdf)
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/file-extension-checker`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const i = document.querySelector('main input[type=search], main input[type=text]');
      return i && Object.keys(i).some(k => k.startsWith('__reactProps$'));
    });
    await page.waitForTimeout(800);
    await page.locator('main input[type=search], main input[type=text]').first().fill("pdf");
    await page.waitForTimeout(800);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const ok = /pdf/i.test(body) && /application\/pdf|Portable Document/i.test(body);
    record("File Extension Checker", ok ? "PASS" : "FAIL", `.pdf info shown: ${ok}`);
    await ctx.close();
  } catch (e) { record("File Extension Checker", "FAIL", e.message.slice(0, 180)); }

  // 8-9. Base64 Encoder / Decoder
  try {
    const out = await runTextTool(browser, "base64-encoder", "Hello ToolBox100", "Encode to Base64");
    const b64 = [...(out.textareas || []), ...(out.outputs || [])].find((v) => v && v !== "Hello ToolBox100" && /^[A-Za-z0-9+/=]+$/.test(v.trim()));
    const ok = b64 && Buffer.from(b64.trim(), "base64").toString() === "Hello ToolBox100";
    record("Base64 Encoder", ok ? "PASS" : "FAIL", `encoded round-trip: ${ok} ("${(b64 || "").slice(0, 30)}")`);
  } catch (e) { record("Base64 Encoder", "FAIL", e.message.slice(0, 180)); }

  try {
    const out = await runTextTool(browser, "base64-decoder", Buffer.from("Audit 42 test").toString("base64"), "Decode");
    const decoded = [...(out.textareas || []), ...(out.outputs || [])].find((v) => v && v.includes("Audit 42"));
    record("Base64 Decoder", decoded ? "PASS" : "FAIL", `decoded: "${(decoded || "").slice(0, 30)}"`);
  } catch (e) { record("Base64 Decoder", "FAIL", e.message.slice(0, 180)); }

  // 10. QR Code Generator
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/qr-code-generator`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const i = document.querySelector("main input[type=text], main textarea");
      return i && Object.keys(i).some(k => k.startsWith('__reactProps$'));
    });
    await page.waitForTimeout(800);
    const inp = page.locator("main input[type=text], main textarea").first();
    await inp.fill("https://toolbox100.example/audit");
    await page.waitForFunction(() => !!document.querySelector('main img[src^="data:image"], main canvas'), undefined, { timeout: 20_000 });
    const imgOk = await page.evaluate(() => !!document.querySelector('main img[src^="data:image"], main canvas'));
    // try downloading
    let dlOk = false;
    const dlBtn = page.locator("main button", { hasText: /download/i }).first();
    if (await dlBtn.isVisible().catch(() => false)) {
      const [dl] = await Promise.all([
        page.waitForEvent("download", { timeout: 20_000 }).catch(() => null),
        dlBtn.click().catch(() => {}),
      ]);
      if (dl) { await dl.saveAs(`${OUT}/qr-test.png`); dlOk = fs.statSync(`${OUT}/qr-test.png`).size > 100; }
    }
    record("QR Code Generator", imgOk && dlOk ? "PASS" : imgOk ? "WARN" : "FAIL", `QR rendered=${imgOk}, downloaded=${dlOk}`);
    await ctx.close();
  } catch (e) { record("QR Code Generator", "FAIL", e.message.slice(0, 180)); }

  // 11. QR Code Reader (reads the QR we just generated)
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/qr-code-reader`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const i = document.querySelector('main input[type=file]');
      return i && Object.keys(i).some(k => k.startsWith('__reactProps$'));
    });
    await page.waitForTimeout(1200);
    await (await page.$('main input[type=file]')).setInputFiles(`${OUT}/qr-test.png`);
    await page.waitForFunction(() => document.querySelector("main").innerText.includes("qr-test.png"));
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const main = document.querySelector("main");
      const btn = [...main.querySelectorAll("button")].find((b) => /detect qr/i.test(b.textContent.trim()));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => document.querySelector("main").innerText.includes("toolbox100.example"), undefined, { timeout: 40_000 });
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    record("QR Code Reader", body.includes("toolbox100.example") ? "PASS" : "FAIL", "decoded URL found");
    await ctx.close();
  } catch (e) { record("QR Code Reader", "FAIL", e.message.slice(0, 180)); }

  /* ---------------- DOCUMENT & TEXT TOOLS ---------------- */

  // 12. Word Counter / 13. Character Counter
  try {
    const out = await runTextTool(browser, "word-counter", "one two three four five", null);
    const body = out.text;
    const ok = /5/.test(body) && /words/i.test(body);
    record("Word Counter", ok ? "PASS" : "FAIL", `counted 5 words: ${ok}`);
  } catch (e) { record("Word Counter", "FAIL", e.message.slice(0, 180)); }

  try {
    const out = await runTextTool(browser, "character-counter", "abcde", null);
    const ok = /5/.test(out.text) && /char/i.test(out.text);
    record("Character Counter", ok ? "PASS" : "FAIL", `counted 5 chars: ${ok}`);
  } catch (e) { record("Character Counter", "FAIL", e.message.slice(0, 180)); }

  // 14. Case Converter
  try {
    const out = await runTextTool(browser, "case-converter", "hello world", "uppercase");
    const upper = [...(out.textareas || []), ...(out.outputs || [])].find((v) => v && v.includes("HELLO WORLD"));
    record("Case Converter", upper ? "PASS" : "FAIL", `uppercase output: ${!!upper} (clicked: ${out.clicked})`);
  } catch (e) { record("Case Converter", "FAIL", e.message.slice(0, 180)); }

  // 15. Remove Duplicate Lines
  try {
    const out = await runTextTool(browser, "remove-duplicate-lines", "a\nb\na\nc\nb", "Remove Duplicates");
    const clean = [...(out.textareas || []), ...(out.outputs || [])].find((v) => v && v !== "a\nb\na\nc\nb" && v.split("\n").filter(Boolean).length === 3);
    record("Remove Duplicate Lines", clean ? "PASS" : "FAIL", `unique lines: ${clean ? clean.replace(/\n/g, "/") : "none"}`);
  } catch (e) { record("Remove Duplicate Lines", "FAIL", e.message.slice(0, 180)); }

  // 16. Sort Lines
  try {
    const out = await runTextTool(browser, "sort-lines", "banana\napple\ncherry", "Sort");
    const sorted = [...(out.textareas || []), ...(out.outputs || [])].find((v) => v && v !== "banana\napple\ncherry" && v.trim().startsWith("apple"));
    record("Sort Lines", sorted ? "PASS" : "FAIL", `sorted: ${sorted ? sorted.replace(/\n/g, "/") : "none"}`);
  } catch (e) { record("Sort Lines", "FAIL", e.message.slice(0, 180)); }

  // 17. Remove Extra Spaces
  try {
    const out = await runTextTool(browser, "remove-extra-spaces", "hello    world  foo", "Remove|Clean");
    const clean = [...(out.textareas || []), ...(out.outputs || [])].find((v) => v && v !== "hello    world  foo" && v.includes("hello world foo"));
    record("Remove Extra Spaces", clean ? "PASS" : "FAIL", `cleaned: "${(clean || "none").slice(0, 40)}"`);
  } catch (e) { record("Remove Extra Spaces", "FAIL", e.message.slice(0, 180)); }

  // 18. Text to PDF
  try {
    const { page, ctx, label } = await runTextareaTool(browser, "text-to-pdf", "Audit text to PDF. Line one.\nLine two with more content to wrap nicely.");
    const p = await downloadResult(page, "text-to-pdf.pdf");
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(p));
    record("Text to PDF", doc.getPageCount() >= 1 ? "PASS" : "FAIL", `button="${label}", ${doc.getPageCount()} page(s)`);
    await closeTest({ page, ctx });
  } catch (e) { record("Text to PDF", "FAIL", e.message.slice(0, 180)); }

  // 19. Text to DOCX
  try {
    const { page, ctx, label } = await runTextareaTool(browser, "text-to-docx", "Audit text to DOCX. Line one.\nLine two.");
    const p = await downloadResult(page, "text-to-docx.docx");
    const buf = fs.readFileSync(p);
    const ok = buf.slice(0, 2).toString() === "PK" && buf.length > 2000;
    record("Text to DOCX", ok ? "PASS" : "FAIL", `button="${label}", valid DOCX=${ok}`);
    await closeTest({ page, ctx });
  } catch (e) { record("Text to DOCX", "FAIL", e.message.slice(0, 180)); }

  // 20. Markdown to HTML
  try {
    const out = await runTextTool(browser, "markdown-to-html", "# Heading\n\n**bold** text", "Convert Markdown");
    const html = [...(out.textareas || []), ...(out.outputs || [])].find((v) => v && v !== "# Heading\n\n**bold** text" && v.includes("<h1"));
    record("Markdown to HTML", html ? "PASS" : "FAIL", `HTML output: ${!!html} (clicked: ${out.clicked})`);
  } catch (e) { record("Markdown to HTML", "FAIL", e.message.slice(0, 180)); }

  // 21. HTML to PDF
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/html-to-pdf`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const ta = document.querySelector("main textarea");
      return ta && Object.keys(ta).some(k => k.startsWith("__reactProps$"));
    });
    await page.waitForTimeout(800);
    await page.locator("main textarea").first().fill("<h1>Audit Report</h1><p>Hello from HTML.</p>");
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const main = document.querySelector("main");
      const btns = [...main.querySelectorAll("button")].filter(b => /(^|\s)bg-primary(\s|$)/.test(b.className) && !b.disabled && b.offsetParent !== null);
      btns[btns.length - 1].click();
    });
    await page.waitForSelector("text=Your file is ready", { timeout: 60_000 });
    const [dl] = await Promise.all([
      page.waitForEvent("download", { timeout: 30_000 }),
      page.evaluate(() => {
        const main = document.querySelector("main");
        [...main.querySelectorAll("button")].find(b => /^download/i.test(b.textContent.trim())).click();
      }),
    ]);
    await dl.saveAs(`${OUT}/html-to-pdf.pdf`);
    const { PDFDocument } = require(PDF_LIB);
    const doc = await PDFDocument.load(fs.readFileSync(`${OUT}/html-to-pdf.pdf`));
    record("HTML to PDF", doc.getPageCount() >= 1 ? "PASS" : "FAIL", `${doc.getPageCount()} page(s), ${fs.statSync(`${OUT}/html-to-pdf.pdf`).size}B`);
    await ctx.close();
  } catch (e) { record("HTML to PDF", "FAIL", e.message.slice(0, 180)); }

  await browser.close();
  const pass = results.filter((r) => r.status === "PASS").length;
  const warn = results.filter((r) => r.status === "WARN").length;
  console.log(`\nBATCH C1: ${pass} PASS / ${warn} WARN / ${results.length - pass - warn} FAIL`);
  fs.writeFileSync("/home/z/my-project/scripts/audit-browser-C1.json", JSON.stringify(results, null, 2));
  process.exit(results.some((r) => r.status === "FAIL") ? 1 : 0);
})();
