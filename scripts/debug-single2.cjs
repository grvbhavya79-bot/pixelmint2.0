/** Debug 2: inspect UI state after merge click in detail. */
const { chromium } = require("/home/z/.npm-global/lib/node_modules/playwright");
const BASE = "http://localhost:3000";
const FILES = "/home/z/my-project/scripts/test-files";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message.slice(0, 300)));
  page.on("console", (m) => console.log(`CONSOLE[${m.type()}]:`, m.text().slice(0, 300)));
  page.on("requestfailed", (r) => console.log("REQ FAILED:", r.url().slice(0, 120), r.failure()?.errorText));
  page.on("response", (r) => { if (r.status() >= 400) console.log("HTTP", r.status(), r.url().slice(0, 120)); });

  await page.goto(`${BASE}/tools/merge-pdf`, { waitUntil: "networkidle" });
  await page.setInputFiles('input[type="file"]', [`${FILES}/test-a.pdf`, `${FILES}/test-b.pdf`]);
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /merge/i }).first().click();

  // poll the UI state every 2s for 30s
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(2000);
    const state = await page.evaluate(() => {
      const t = document.body.innerText;
      return {
        ready: t.includes("Your file is ready"),
        error: t.includes("couldn't") || t.includes("Error") || t.includes("error"),
        reading: t.includes("Reading files"),
        processing: t.includes("Processing"),
        finishing: t.includes("Preparing download"),
        snippet: t.slice(t.indexOf("Merge PDF"), t.indexOf("Merge PDF") + 400).replace(/\n+/g, " | "),
      };
    });
    console.log(`t+${(i + 1) * 2}s:`, JSON.stringify(state).slice(0, 500));
    if (state.ready || (state.error && !state.processing && !state.reading)) break;
  }
  await browser.close();
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
