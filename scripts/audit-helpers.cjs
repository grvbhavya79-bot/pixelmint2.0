/**
 * ToolBox100 — Browser Functional Audit (shared helpers)
 * Robust primary-action click: finds the bg-primary button inside <main>.
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
  console.log(`${status === "PASS" ? "PASS" : status === "WARN" ? "WARN" : "FAIL"} | ${tool} | ${detail}`);
}

/** Upload files, click primary action, wait for result panel. Returns page. */
async function runFileTool(browser, slug, filePaths, opts = {}) {
  // fresh context per test: downloads in one context poison file inputs in
  // subsequent pages of the same context (Chromium quirk)
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(70_000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // goto with networkidle: SSG HTML contains the file input, but the lazy tool
  // chunk + full hydration must finish before the change event is reliable
  await page.goto(`${BASE}/tools/${slug}`, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => {});
  // wait for the tool chunk to load AND React to attach its onChange handler
  await page.waitForFunction(() => {
    const input = document.querySelector('main input[type="file"]');
    if (!input) return false;
    const propsKey = Object.keys(input).find((k) => k.startsWith("__reactProps$"));
    if (!propsKey) return false;
    const props = input[propsKey];
    return props && typeof props.onChange === "function";
  });
  if (process.env.AUDIT_VERBOSE) console.log(`   [${slug}] onChange attached`);
  // settle time: let React finish hydrating the full tree
  await page.waitForTimeout(1200);
  // set files with retry: guard against transient hydration drops
  const firstName = path.basename(filePaths[0]);
  let rowAppeared = false;
  for (let attempt = 0; attempt < 3 && !rowAppeared; attempt++) {
    const handle = await page.$('main input[type="file"]');
    if (!handle) throw new Error("file input disappeared");
    await handle.setInputFiles(filePaths.map((f) => (f.startsWith("/") ? f : path.join(FILES, f))));
    await handle.dispose().catch(() => {});
    rowAppeared = await page
      .waitForFunction(
        (name) => {
          const main = document.querySelector("main") || document.body;
          return main.innerText.includes(name);
        },
        firstName,
        { timeout: 6000 },
      )
      .then(() => true)
      .catch(() => false);
  }
  if (!rowAppeared) throw new Error("file row never appeared after upload (3 attempts)");
  await page.waitForTimeout(800);
  if (opts.beforeClick) await opts.beforeClick(page);
  // click primary action button (wait until one is visible & enabled)
  await page.waitForFunction(() => {
    const main = document.querySelector("main") || document.body;
    const btns = [...main.querySelectorAll("button")].filter(
      (b) => /(^|\s)bg-primary(\s|$)/.test(b.className) && !b.disabled && b.offsetParent !== null,
    );
    return btns.length > 0;
  });
  const label = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const btns = [...main.querySelectorAll("button")].filter(
      (b) => /(^|\s)bg-primary(\s|$)/.test(b.className) && !b.disabled && b.offsetParent !== null,
    );
    if (!btns.length) return null;
    const btn = btns[btns.length - 1];
    btn.click();
    return btn.textContent.trim();
  });
  if (!label) throw new Error("no primary action button found");
  await page.waitForSelector("text=Your file is ready", { timeout: 70_000 });
  return { page, ctx, label, errors };
}

/** Close a test's page + context. */
async function closeTest({ page, ctx }) {
  await page.close().catch(() => {});
  await ctx.close().catch(() => {});
}

/** Click download in result panel, save, return path. */
async function downloadResult(page, name) {
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 60_000 }),
    page.evaluate(() => {
      const main = document.querySelector("main") || document.body;
      const dl = [...main.querySelectorAll("button")].find((b) => /^download/i.test(b.textContent.trim()));
      dl.click();
    }),
  ]);
  const p = path.join(OUT, name);
  await download.saveAs(p);
  return p;
}

function pageErrors(errors) {
  return errors.filter((e) => !/ResizeObserver|favicon|DevTools/i.test(e));
}

module.exports = { chromium, BASE, FILES, OUT, results, record, runFileTool, downloadResult, closeTest, pageErrors };
