/** Debug: single tool test with screenshots at each stage. */
const { chromium } = require("/home/z/.npm-global/lib/node_modules/playwright");
const BASE = "http://localhost:3000";
const FILES = "/home/z/my-project/scripts/test-files";
const OUT = "/home/z/my-project/scripts/test-output";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message.slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE ERROR:", m.text().slice(0, 200)); });

  console.log("1. Open merge-pdf page");
  await page.goto(`${BASE}/tools/merge-pdf`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/dbg-1-page.png` });

  console.log("2. Upload two PDFs");
  await page.setInputFiles('input[type="file"]', [`${FILES}/test-a.pdf`, `${FILES}/test-b.pdf`]);
  await page.waitForSelector("li", { timeout: 20_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/dbg-2-files.png` });

  console.log("3. List visible buttons:");
  const buttons = await page.locator("button:visible").allTextContents();
  console.log("   ", JSON.stringify(buttons));

  console.log("4. Click merge button");
  await page.getByRole("button", { name: /merge/i }).first().click();
  try {
    await page.waitForSelector("text=Your file is ready", { timeout: 30000 });
    console.log("5. RESULT PANEL APPEARED ✓");
    const dl = page.getByRole("button", { name: /download/i }).first();
    console.log("6. Download button text:", await dl.textContent());
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      dl.click(),
    ]);
    await download.saveAs(`${OUT}/dbg-merged.pdf`);
    console.log("7. Downloaded:", (await download.path()));
  } catch (e) {
    console.log("5. RESULT DID NOT APPEAR:", e.message.slice(0, 150));
    await page.screenshot({ path: `${OUT}/dbg-3-failed.png`, fullPage: true });
    const body = await page.evaluate(() => document.body.innerText);
    console.log("6. Body:", body.slice(-800).replace(/\n+/g, " | "));
  }

  await browser.close();
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
