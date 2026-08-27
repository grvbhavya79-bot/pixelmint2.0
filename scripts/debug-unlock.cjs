/** Isolated Unlock PDF debug: step-by-step with verbose state dumps. */
const { chromium } = require("/home/z/.npm-global/lib/node_modules/playwright");
const path = require("path");

const BASE = "http://localhost:3000";
const OUT = "/home/z/my-project/scripts/test-output";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(70_000);
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text().slice(0, 150)); });

  console.log("1. goto unlock-pdf…");
  await page.goto(`${BASE}/tools/unlock-pdf`, { waitUntil: "networkidle", timeout: 60_000 }).catch((e) => console.log("   goto warn:", e.message.slice(0, 80)));

  console.log("2. wait onChange attached…");
  await page.waitForFunction(() => {
    const input = document.querySelector('main input[type="file"]');
    if (!input) return false;
    const propsKey = Object.keys(input).find((k) => k.startsWith("__reactProps$"));
    return propsKey && input[propsKey] && typeof input[propsKey].onChange === "function";
  });
  console.log("   attached ✓");
  await page.waitForTimeout(1200);

  console.log("3. upload protect-output.pdf…");
  const handle = await page.$('main input[type="file"]');
  await handle.setInputFiles([path.join(OUT, "protect-output.pdf")]);
  await page.waitForFunction(
    (n) => (document.querySelector("main") || document.body).innerText.includes(n),
    "protect-output.pdf",
    { timeout: 10_000 },
  ).then(() => console.log("   row ✓")).catch(() => console.log("   row ✗ (timeout)"));
  await page.waitForTimeout(800);

  console.log("4. fill password…");
  const pws = page.locator('input[type="password"], input[placeholder*="password" i]');
  const n = await pws.count();
  console.log(`   password inputs found: ${n}`);
  for (let i = 0; i < n; i++) await pws.nth(i).fill("auditpw123");
  const pwVal = n ? await pws.first().inputValue() : null;
  console.log(`   password value now: ${JSON.stringify(pwVal)}`);

  console.log("5. click Unlock…");
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

  console.log("6. wait for result panel (max 45s)…");
  const t0 = Date.now();
  const gotResult = await page
    .waitForSelector("text=Your file is ready", { timeout: 45_000 })
    .then(() => true)
    .catch(() => false);
  console.log(`   result: ${gotResult} after ${Math.round((Date.now() - t0) / 1000)}s`);
  if (!gotResult) {
    const mainText = await page.evaluate(() => (document.querySelector("main") || document.body).innerText.slice(0, 600));
    console.log("   --- MAIN TEXT ---");
    console.log(mainText);
    await page.screenshot({ path: "/home/z/my-project/scripts/dbg-unlock.png", fullPage: true });
    console.log("   screenshot → scripts/dbg-unlock.png");
  }
  console.log("7. page errors:", errors.length ? errors : "none");

  await browser.close();
})();
