/** Debug a single tool page: goto, hydrate, upload, click, capture everything. */
const { chromium } = require("/home/z/.npm-global/lib/node_modules/playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:3000";
const FILES = "/home/z/my-project/scripts/test-files";

const slug = process.argv[2] || "compress-pdf";
const file = process.argv[3] || "multi-4.pdf";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("CONSOLE: " + m.text().slice(0, 300));
  });

  console.log(`1. goto /tools/${slug}…`);
  await page.goto(`${BASE}/tools/${slug}`, { waitUntil: "networkidle", timeout: 45_000 }).catch((e) => console.log("   goto:", e.message.slice(0, 100)));

  console.log("2. wait onChange…");
  const attached = await page.waitForFunction(() => {
    const input = document.querySelector('main input[type="file"]');
    if (!input) return false;
    const key = Object.keys(input).find((k) => k.startsWith("__reactProps$"));
    return key && input[key] && typeof input[key].onChange === "function";
  }, { timeout: 30_000 }).then(() => true).catch(() => false);
  console.log(`   onChange attached: ${attached}`);

  if (!attached) {
    console.log("   --- dump main text ---");
    console.log((await page.evaluate(() => document.querySelector("main")?.innerText.slice(0, 300))) || "(no main)");
    console.log("   --- errors ---", errors.slice(0, 5));
    await page.screenshot({ path: `/home/z/my-project/scripts/dbg-${slug}.png`, fullPage: true });
    await browser.close();
    return;
  }

  await page.waitForTimeout(1200);
  console.log(`3. upload ${file}…`);
  const handle = await page.$('main input[type="file"]');
  await handle.setInputFiles([path.join(FILES, file)]);
  const rowOk = await page.waitForFunction(
    (n) => (document.querySelector("main") || document.body).innerText.includes(n),
    file, { timeout: 10_000 },
  ).then(() => true).catch(() => false);
  console.log(`   file row: ${rowOk}`);

  await page.waitForTimeout(800);
  console.log("4. click primary…");
  const label = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const btns = [...main.querySelectorAll("button")].filter(
      (b) => /(^|\s)bg-primary(\s|$)/.test(b.className) && !b.disabled && b.offsetParent !== null,
    );
    if (!btns.length) return "NO BUTTON";
    btns[btns.length - 1].click();
    return btns[btns.length - 1].textContent.trim();
  });
  console.log(`   clicked: "${label}"`);

  console.log("5. wait result (40s)…");
  const got = await page.waitForSelector("text=Your file is ready", { timeout: 40_000 }).then(() => true).catch(() => false);
  console.log(`   result: ${got}`);
  if (!got) {
    console.log("   --- main text after click ---");
    console.log((await page.evaluate(() => document.querySelector("main")?.innerText.slice(0, 500))) || "(no main)");
    await page.screenshot({ path: `/home/z/my-project/scripts/dbg-${slug}.png`, fullPage: true });
  }
  console.log("6. errors:", errors.length ? errors.slice(0, 6) : "none");
  await browser.close();
})();
