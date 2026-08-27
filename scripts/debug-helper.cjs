/** Debug the helper flow with event instrumentation. */
const { chromium } = require("/home/z/.npm-global/lib/node_modules/playwright");

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(70000);
  const errors = [];
  page.on("pageerror", (e) => { errors.push(e.message); console.log("PAGEERROR:", e.message.slice(0, 200)); });
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE_ERR:", m.text().slice(0, 200)); });

  await page.goto("http://localhost:3000/tools/split-pdf", { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  console.log("goto done");
  await page.waitForFunction(() => {
    const input = document.querySelector('main input[type="file"]');
    if (!input) return false;
    const propsKey = Object.keys(input).find((k) => k.startsWith("__reactProps$"));
    if (!propsKey) return false;
    const props = input[propsKey];
    return props && typeof props.onChange === "function";
  });
  console.log("onChange attached");
  await page.waitForTimeout(1200);

  // instrument change + react render
  await page.evaluate(() => {
    const input = document.querySelector('main input[type="file"]');
    input.addEventListener("change", () => {
      (window).__auditChange = Date.now();
      console.log("AUDIT: change fired");
    });
    // patch setState detection: watch for li appearance
    const obs = new MutationObserver(() => {
      if (!window.__auditRow && document.querySelector("main").querySelectorAll("ul > li").length > 0) {
        window.__auditRow = Date.now();
        console.log("AUDIT: row appeared at +" + (Date.now() - window.__auditChange) + "ms after change");
      }
    });
    obs.observe(document.querySelector("main"), { childList: true, subtree: true });
  });

  const handle = await page.$('main input[type="file"]');
  await handle.setInputFiles("/home/z/my-project/scripts/test-files/multi-4.pdf");
  await handle.dispose().catch(() => {});
  console.log("files set, waiting 8s...");
  await page.waitForTimeout(8000);
  const state = await page.evaluate(() => ({
    change: window.__auditChange ? "fired" : "NOT fired",
    row: window.__auditRow ? "appeared" : "NOT appeared",
    li: document.querySelector("main").querySelectorAll("li").length,
  }));
  console.log("RESULT:", JSON.stringify(state), "| pageerrors:", errors.length);
  await browser.close();
})().catch((e) => { console.error("FATAL:", e.message.slice(0, 200)); process.exit(1); });
