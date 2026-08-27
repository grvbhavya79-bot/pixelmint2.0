/** Browser audit batch D: remaining tool variants + negative/edge-case tests + mobile check. */
const { chromium, FILES, OUT, results, record, runFileTool, downloadResult, closeTest } = require("./audit-helpers.cjs");
const fs = require("fs");
const SHARP = "/home/z/.npm-global/lib/node_modules/sharp";
const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();

  /* ---- Remaining tool variants ---- */

  // Image Rotator (rotate 90°)
  try {
    const { page, ctx, label } = await runFileTool(browser, "image-rotator", ["test-image.png"], {
      beforeClick: async (page) => {
        await page.evaluate(() => {
          const main = document.querySelector("main");
          const btn = [...main.querySelectorAll("button")].find((b) => b.textContent.trim().endsWith("90°"));
          if (btn) btn.click();
        });
        await page.waitForTimeout(400);
      },
    });
    const p = await downloadResult(page, "rotated.png");
    const sharp = require(SHARP);
    const meta = await sharp(p).metadata();
    const ok = meta.width === 300 && meta.height === 400; // 400x300 rotated → 300x400
    record("Image Rotator", ok ? "PASS" : "WARN", `button="${label}", ${meta.width}x${meta.height} (expect 300x400)`);
    await closeTest({ page, ctx });
  } catch (e) { record("Image Rotator", "FAIL", e.message.slice(0, 180)); }

  // Image Flipper
  try {
    const { page, ctx, label } = await runFileTool(browser, "image-flipper", ["test-image.png"]);
    const p = await downloadResult(page, "flipped.png");
    const sharp = require(SHARP);
    const meta = await sharp(p).metadata();
    const ok = meta.width === 400 && meta.height === 300;
    record("Image Flipper", ok ? "PASS" : "FAIL", `button="${label}", ${meta.width}x${meta.height}`);
    await closeTest({ page, ctx });
  } catch (e) { record("Image Flipper", "FAIL", e.message.slice(0, 180)); }

  // Image Sharpen
  try {
    const { page, ctx, label } = await runFileTool(browser, "image-sharpen", ["test-image.png"]);
    const p = await downloadResult(page, "sharpened.png");
    const sharp = require(SHARP);
    const meta = await sharp(p).metadata();
    record("Image Sharpen", meta.format === "png" ? "PASS" : "FAIL", `button="${label}", ${meta.format}`);
    await closeTest({ page, ctx });
  } catch (e) { record("Image Sharpen", "FAIL", e.message.slice(0, 180)); }

  // Image Filters (generic)
  try {
    const { page, ctx, label } = await runFileTool(browser, "image-filters", ["test-image.png"]);
    const p = await downloadResult(page, "filtered.png");
    const sharp = require(SHARP);
    const meta = await sharp(p).metadata();
    record("Image Filters", meta.format ? "PASS" : "FAIL", `button="${label}", ${meta.format}`);
    await closeTest({ page, ctx });
  } catch (e) { record("Image Filters", "FAIL", e.message.slice(0, 180)); }

  // JPG to WEBP + PNG to WEBP + WEBP to JPG (remaining converters)
  try {
    const sharp = require(SHARP);
    await sharp(`${FILES}/test-image.png`).webp().toFile(`${OUT}/test.webp`);
    for (const [slug, file, expectFmt] of [
      ["jpg-to-webp", "test-image.jpg", "webp"],
      ["png-to-webp", "test-image.png", "webp"],
      ["webp-to-jpg", `${OUT}/test.webp`, "jpeg"],
    ]) {
      const { page, ctx, label } = await runFileTool(browser, slug, [file]);
      const p = await downloadResult(page, `conv-${slug}.img`);
      const meta = await sharp(p).metadata();
      record(slug, meta.format === expectFmt ? "PASS" : "FAIL", `button="${label}", format=${meta.format} (expect ${expectFmt})`);
      await closeTest({ page, ctx });
    }
  } catch (e) { record("Image converters (rest)", "FAIL", e.message.slice(0, 180)); }

  /* ---- Negative / edge-case tests ---- */

  // 1. PDF uploaded to image-only tool → rejected with friendly message
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/image-compressor`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const i = document.querySelector('main input[type=file]');
      return i && Object.keys(i).some(k => k.startsWith('__reactProps$'));
    });
    await page.waitForTimeout(1200);
    await (await page.$('main input[type=file]')).setInputFiles(`${FILES}/test-a.pdf`);
    await page.waitForTimeout(2000);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const rejected = /isn't a supported file type|PDF detected|not supported/i.test(body);
    const noResult = !body.includes("Your file is ready");
    record("Negative: PDF→image tool rejected", rejected && noResult ? "PASS" : "FAIL", `friendly rejection: ${rejected}`);
    await ctx.close();
  } catch (e) { record("Negative: PDF→image tool rejected", "FAIL", e.message.slice(0, 160)); }

  // 2. Corrupt PDF into merge → error panel, no crash
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => record("Negative: corrupt PDF", "WARN", `page error: ${e.message.slice(0, 80)}`));
    fs.writeFileSync(`${OUT}/corrupt.pdf`, Buffer.from("this is definitely not a pdf file"));
    await page.goto(`${BASE}/tools/merge-pdf`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const i = document.querySelector('main input[type=file]');
      return i && Object.keys(i).some(k => k.startsWith('__reactProps$'));
    });
    await page.waitForTimeout(1200);
    await (await page.$('main input[type=file]')).setInputFiles(`${OUT}/corrupt.pdf`);
    await page.waitForFunction(() => document.querySelector("main").innerText.includes("corrupt.pdf"));
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const main = document.querySelector("main");
      const btns = [...main.querySelectorAll("button")].filter(b => /(^|\s)bg-primary(\s|$)/.test(b.className) && !b.disabled && b.offsetParent !== null);
      if (btns.length >= 1) btns[btns.length - 1].click();
    });
    await page.waitForTimeout(5000);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const hasError = /couldn't|failed|invalid|corrupt|try again/i.test(body);
    const noResult = !body.includes("Your file is ready");
    record("Negative: corrupt PDF handling", hasError && noResult ? "PASS" : "FAIL", `error panel shown: ${hasError}`);
    await ctx.close();
  } catch (e) { record("Negative: corrupt PDF handling", "FAIL", e.message.slice(0, 160)); }

  // 3. Empty input in text tool → button disabled or no crash
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/json-formatter`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const state = await page.evaluate(() => {
      const main = document.querySelector("main");
      const btn = [...main.querySelectorAll("button")].find((b) => /format json/i.test(b.textContent.trim()));
      return { btnExists: !!btn, disabled: btn ? btn.disabled : null };
    });
    record("Negative: empty JSON input", state.btnExists && state.disabled ? "PASS" : "WARN", `Format button disabled on empty input: ${state.disabled}`);
    await ctx.close();
  } catch (e) { record("Negative: empty JSON input", "FAIL", e.message.slice(0, 160)); }

  // 4. Invalid JSON → friendly error
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/json-formatter`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const ta = document.querySelector("main textarea");
      return ta && Object.keys(ta).some(k => k.startsWith('__reactProps$'));
    });
    await page.waitForTimeout(800);
    await page.locator("main textarea").first().fill('{"broken": xyz}');
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const main = document.querySelector("main");
      const btn = [...main.querySelectorAll("button")].find((b) => /format json/i.test(b.textContent.trim()));
      btn.click();
    });
    await page.waitForTimeout(1000);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const ok = /problem|error|invalid|unexpected/i.test(body);
    record("Negative: invalid JSON error", ok ? "PASS" : "FAIL", `friendly error: ${ok}`);
    await ctx.close();
  } catch (e) { record("Negative: invalid JSON error", "FAIL", e.message.slice(0, 160)); }

  // 5. Calculator empty/invalid input → no crash
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    page.on("pageerror", () => record("Negative: calculator NaN", "WARN", "page error"));
    await page.goto(`${BASE}/tools/percentage-calculator`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const nums = page.locator('main input[type=number]');
    const n = await nums.count();
    if (n >= 2) {
      await nums.nth(0).fill("");
      await nums.nth(1).fill("");
    }
    await page.waitForTimeout(300);
    await page.waitForTimeout(1000);
    const alive = await page.evaluate(() => !!document.querySelector("main"));
    record("Negative: calculator invalid input", alive ? "PASS" : "FAIL", `page survives invalid input: ${alive}`);
    await ctx.close();
  } catch (e) { record("Negative: calculator invalid input", "FAIL", e.message.slice(0, 160)); }

  /* ---- Mobile responsive check ---- */
  try {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const overflows = [];
    for (const path of ["/", "/tools", "/tools/merge-pdf", "/categories", "/contact"]) {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      overflows.push(`${path}: ${overflow}px`);
    }
    const bad = overflows.filter((o) => !o.endsWith(": 0px") && !o.endsWith(": 1px") && !o.endsWith(": 2px"));
    record("Mobile responsive (375px)", bad.length === 0 ? "PASS" : "WARN", `horizontal overflow: ${bad.length ? bad.join("; ") : "none"}`);
    await page.screenshot({ path: `${OUT}/mobile-home.png` });
    await ctx.close();
  } catch (e) { record("Mobile responsive (375px)", "FAIL", e.message.slice(0, 160)); }

  // Tablet + desktop overflow check
  try {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const page = await ctx.newPage();
    const overflows = [];
    for (const path of ["/", "/tools/merge-pdf", "/tools/json-formatter"]) {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      overflows.push(`${path}: ${overflow}px`);
    }
    const bad = overflows.filter((o) => parseInt(o.split(": ")[1]) > 2);
    record("Tablet responsive (768px)", bad.length === 0 ? "PASS" : "WARN", `overflow: ${bad.length ? bad.join("; ") : "none"}`);
    await ctx.close();
  } catch (e) { record("Tablet responsive (768px)", "FAIL", e.message.slice(0, 160)); }

  /* ---- Homepage console error check ---- */
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    const filtered = errors.filter((e) => !/favicon|DevTools|ResizeObserver/i.test(e));
    record("Homepage console errors", filtered.length === 0 ? "PASS" : "WARN", filtered.length ? filtered[0].slice(0, 120) : "clean console");
    await ctx.close();
  } catch (e) { record("Homepage console errors", "FAIL", e.message.slice(0, 160)); }

  await browser.close();
  const pass = results.filter((r) => r.status === "PASS").length;
  const warn = results.filter((r) => r.status === "WARN").length;
  console.log(`\nBATCH D: ${pass} PASS / ${warn} WARN / ${results.length - pass - warn} FAIL`);
  fs.writeFileSync("/home/z/my-project/scripts/audit-browser-D.json", JSON.stringify(results, null, 2));
  process.exit(results.some((r) => r.status === "FAIL") ? 1 : 0);
})();
