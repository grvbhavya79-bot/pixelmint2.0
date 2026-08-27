/** Debug 3: direct DOM click + React state inspection. */
const { chromium } = require("/home/z/.npm-global/lib/node_modules/playwright");
const BASE = "http://localhost:3000";
const FILES = "/home/z/my-project/scripts/test-files";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message.slice(0, 300)));
  page.on("console", (m) => console.log(`CONSOLE[${m.type()}]:`, m.text().slice(0, 300)));

  await page.goto(`${BASE}/tools/merge-pdf`, { waitUntil: "networkidle" });
  await page.setInputFiles('input[type="file"]', [`${FILES}/test-a.pdf`, `${FILES}/test-b.pdf`]);
  await page.waitForTimeout(1000);

  // Direct DOM click on the merge button
  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /merge/i.test(b.textContent || ""));
    if (!btn) return "NOT FOUND";
    console.log("clicking:", btn.textContent, "disabled=", btn.disabled);
    btn.click();
    return `clicked: ${btn.textContent} (disabled=${btn.disabled})`;
  });
  console.log("DOM click:", clicked);

  await page.waitForTimeout(6000);
  const state = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      reading: t.includes("Reading files"),
      processing: t.includes("Processing"),
      ready: t.includes("Your file is ready"),
      errorPanel: t.includes("couldn't") || t.includes("try again"),
    };
  });
  console.log("State after DOM click:", state);
  await page.screenshot({ path: "/home/z/my-project/scripts/test-output/dbg3.png", fullPage: true });
  await browser.close();
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
