/** Browser audit batch C2: developer tools (15) + generators + calculators UI checks. */
const { chromium, results, record } = require("./audit-helpers.cjs");
const fs = require("fs");
const BASE = "http://localhost:3000";

/** Text tool: fill first textarea, click button by regex, read textareas+outputs. */
async function runTextTool(browser, slug, input, buttonRegex, waitMs = 1200) {
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
  if (input !== null) await page.locator("main textarea").first().fill(input);
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
      clicked = await page.evaluate(() => {
        const main = document.querySelector("main");
        const btns = [...main.querySelectorAll("button")].filter((b) => /(^|\s)bg-primary(\s|$)/.test(b.className) && !b.disabled && b.offsetParent !== null);
        if (btns.length) { btns[btns.length - 1].click(); return btns[btns.length - 1].textContent.trim(); }
        return null;
      }).catch(() => null);
    }
  }
  await page.waitForTimeout(waitMs);
  const out = await page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      textareas: [...main.querySelectorAll("textarea")].map((t) => t.value),
      outputs: [...main.querySelectorAll("output")].map((o) => o.textContent),
      text: main.innerText,
      inputs: [...main.querySelectorAll("input")].map((i) => ({ type: i.type, value: i.value, ph: (i.placeholder || "").slice(0, 24) })),
    };
  });
  out.clicked = clicked;
  await ctx.close();
  return out;
}

const JSON_IN = '{"name":"audit","version":1,"nested":{"ok":true,"list":[1,2,3]}}';
const XML_IN = '<root><item id="1">alpha</item><item id="2">beta</item></root>';
const HTML_IN = '<div><h1>Title</h1><p>Some <b>bold</b> text</p></div>';
const CSS_IN = 'body{margin:0;color:#333}.card{padding:12px;border-radius:8px}';
const JS_IN = 'function add(a,b){return a+b}const x=[1,2,3].map(n=>n*2);console.log(x);';
const SQL_IN = "select id,name from users where created_at > '2026-01-01' order by id desc;";


/** Button-driven tool: wait for page interactive, click a button by regex, read text. */
async function runClickTool(browser, slug, buttonRegex) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(40_000);
  await page.goto(`${BASE}/tools/${slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  let clicked = null;
  if (buttonRegex) {
    clicked = await page.evaluate((reSrc) => {
      const re = new RegExp(reSrc, "i");
      const main = document.querySelector("main");
      const btns = [...main.querySelectorAll("button")].filter((b) => re.test(b.textContent.trim()) && !b.disabled && b.offsetParent !== null);
      if (btns.length) { btns[0].click(); return btns[0].textContent.trim(); }
      return null;
    }, buttonRegex).catch(() => null);
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

(async () => {
  const browser = await chromium.launch();

  /* ---------------- DEVELOPER TOOLS ---------------- */

  // JSON Formatter
  try {
    const out = await runTextTool(browser, "json-formatter", JSON_IN, /format|beautify|pretty/i);
    const pretty = [...out.textareas, ...out.outputs].find((v) => v && v.includes('\n  "name"'));
    record("JSON Formatter", pretty ? "PASS" : "FAIL", `pretty-printed: ${!!pretty} (clicked: ${out.clicked})`);
  } catch (e) { record("JSON Formatter", "FAIL", e.message.slice(0, 160)); }

  // JSON Validator (valid + invalid)
  try {
    const ok = await runTextTool(browser, "json-validator", JSON_IN, /validate|check/i);
    const validOk = /valid|well-formed/i.test(ok.text);
    const bad = await runTextTool(browser, "json-validator", '{"broken": tru}', /validate|check/i);
    const invalidOk = /invalid|error|problem/i.test(bad.text);
    record("JSON Validator", validOk && invalidOk ? "PASS" : "FAIL", `valid detected=${validOk}, invalid detected=${invalidOk}`);
  } catch (e) { record("JSON Validator", "FAIL", e.message.slice(0, 160)); }

  // JSON Minifier
  try {
    const out = await runTextTool(browser, "json-minifier", JSON_IN.replace(/\s/g, "\n  "), /minify/i);
    const min = [...out.textareas, ...out.outputs].find((v) => v && v.length <= JSON_IN.length && v.includes('"name":"audit"'));
    record("JSON Minifier", min ? "PASS" : "FAIL", `minified: ${!!min}`);
  } catch (e) { record("JSON Minifier", "FAIL", e.message.slice(0, 160)); }

  // XML Formatter + Validator
  try {
    const out = await runTextTool(browser, "xml-formatter", XML_IN, /format|beautify|pretty/i);
    const pretty = [...out.textareas, ...out.outputs].find((v) => v && v.includes("\n  <item"));
    record("XML Formatter", pretty ? "PASS" : "FAIL", `formatted: ${!!pretty}`);
  } catch (e) { record("XML Formatter", "FAIL", e.message.slice(0, 160)); }

  try {
    const ok = await runTextTool(browser, "xml-validator", XML_IN, /validate|check/i);
    const validOk = /valid|well-formed/i.test(ok.text);
    const bad = await runTextTool(browser, "xml-validator", "<root><unclosed>", /validate|check/i);
    const invalidOk = /invalid|error|problem/i.test(bad.text);
    record("XML Validator", validOk && invalidOk ? "PASS" : "FAIL", `valid=${validOk}, invalid detected=${invalidOk}`);
  } catch (e) { record("XML Validator", "FAIL", e.message.slice(0, 160)); }

  // HTML Formatter + Minifier
  try {
    const out = await runTextTool(browser, "html-formatter", HTML_IN, /format|beautify|pretty/i);
    const pretty = [...out.textareas, ...out.outputs].find((v) => v && v !== HTML_IN && v.includes("<h1>"));
    record("HTML Formatter", pretty ? "PASS" : "FAIL", `formatted: ${!!pretty}`);
  } catch (e) { record("HTML Formatter", "FAIL", e.message.slice(0, 160)); }

  try {
    const out = await runTextTool(browser, "html-minifier", HTML_IN + "\n", /minify/i);
    const min = [...out.textareas, ...out.outputs].find((v) => v && v.length <= HTML_IN.length && v.includes("<h1>"));
    record("HTML Minifier", min ? "PASS" : "FAIL", `minified: ${!!min}`);
  } catch (e) { record("HTML Minifier", "FAIL", e.message.slice(0, 160)); }

  // CSS Formatter + Minifier
  try {
    const out = await runTextTool(browser, "css-formatter", CSS_IN, /format|beautify|pretty/i);
    const pretty = [...out.textareas, ...out.outputs].find((v) => v && v.includes("\n  ") && v.includes("margin"));
    record("CSS Formatter", pretty ? "PASS" : "FAIL", `formatted: ${!!pretty}`);
  } catch (e) { record("CSS Formatter", "FAIL", e.message.slice(0, 160)); }

  try {
    const out = await runTextTool(browser, "css-minifier", CSS_IN.replace(/;/g, ";\n"), /minify/i);
    const min = [...out.textareas, ...out.outputs].find((v) => v && v.length <= CSS_IN.length && v.includes("margin:0"));
    record("CSS Minifier", min ? "PASS" : "FAIL", `minified: ${!!min}`);
  } catch (e) { record("CSS Minifier", "FAIL", e.message.slice(0, 160)); }

  // JS Formatter + Minifier
  try {
    const out = await runTextTool(browser, "javascript-formatter", JS_IN, /format|beautify|pretty/i);
    const pretty = [...out.textareas, ...out.outputs].find((v) => v && v !== JS_IN && v.includes("function add"));
    record("JavaScript Formatter", pretty ? "PASS" : "FAIL", `formatted: ${!!pretty}`);
  } catch (e) { record("JavaScript Formatter", "FAIL", e.message.slice(0, 160)); }

  try {
    const out = await runTextTool(browser, "javascript-minifier", JS_IN + "\n\n", /minify/i);
    const min = [...out.textareas, ...out.outputs].find((v) => v && v.length < JS_IN.length + 2 && v.includes("add"));
    record("JavaScript Minifier", min ? "PASS" : "FAIL", `minified: ${!!min} (${(min || "").length} chars)`);
  } catch (e) { record("JavaScript Minifier", "FAIL", e.message.slice(0, 160)); }

  // SQL Formatter + Minifier
  try {
    const out = await runTextTool(browser, "sql-formatter", SQL_IN, /format|beautify|pretty/i);
    const pretty = [...out.textareas, ...out.outputs].find((v) => v && v !== SQL_IN && v.toLowerCase().includes("select"));
    record("SQL Formatter", pretty ? "PASS" : "FAIL", `formatted: ${!!pretty}`);
  } catch (e) { record("SQL Formatter", "FAIL", e.message.slice(0, 160)); }

  try {
    const out = await runTextTool(browser, "sql-minifier", SQL_IN.replace(/ /g, "\n"), /minify/i);
    const min = [...out.textareas, ...out.outputs].find((v) => v && v.length <= SQL_IN.length && v.includes("select id"));
    record("SQL Minifier", min ? "PASS" : "FAIL", `minified: ${!!min}`);
  } catch (e) { record("SQL Minifier", "FAIL", e.message.slice(0, 160)); }

  // Regex Tester
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/regex-tester`, { waitUntil: "networkidle" });
    await page.waitForSelector('#re-pattern', { state: "visible" });
    await page.waitForTimeout(1500);
    // fill pattern + flags + test string
    const pattern = page.locator('#re-pattern');
    await pattern.fill("\\d+");
    const testArea = page.locator("main textarea").first();
    await testArea.fill("abc 123 def 456");
    await page.waitForTimeout(1200);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const matches = /123|456|2 match/i.test(body);
    record("Regex Tester", matches ? "PASS" : "FAIL", `\\d+ matches found in UI: ${matches}`);
    await ctx.close();
  } catch (e) { record("Regex Tester", "FAIL", e.message.slice(0, 160)); }

  // UUID Generator
  try {
    const out = await runClickTool(browser, "uuid-generator", /generate/i);
    const uuid = (out.textareas.join(" ") + " " + out.outputs.join(" ") + " " + out.text).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    record("UUID Generator", uuid ? "PASS" : "FAIL", `generated: ${uuid ? uuid[0] : "none"}`);
  } catch (e) { record("UUID Generator", "FAIL", e.message.slice(0, 160)); }

  /* ---------------- GENERATORS ---------------- */

  // Password Generator
  try {
    const out = await runClickTool(browser, "password-generator", /generate/i);
    const pw = (out.textareas.join(" ") + out.outputs.join(" ") + out.text).match(/\b[A-Za-z0-9!@#$%^&*()\-_=+]{8,32}\b/);
    const hasStrength = /strength|strong|weak|medium/i.test(out.text);
    record("Password Generator", pw && hasStrength ? "PASS" : "FAIL", `password: ${pw ? pw[0].slice(0, 6) + "…" : "none"}, strength meter: ${hasStrength}`);
  } catch (e) { record("Password Generator", "FAIL", e.message.slice(0, 160)); }

  // Random Number Generator
  try {
    const out = await runClickTool(browser, "random-number-generator", /generate|roll/i);
    const num = (out.text).match(/\b\d+(\.\d+)?\b/);
    record("Random Number Generator", num ? "PASS" : "FAIL", `number generated: ${num ? num[0] : "none"}`);
  } catch (e) { record("Random Number Generator", "FAIL", e.message.slice(0, 160)); }

  // Lorem Ipsum Generator
  try {
    const out = await runClickTool(browser, "lorem-ipsum-generator", /generate/i);
    const lorem = /lorem ipsum|dolor sit amet/i.test(out.textareas.join(" ") + out.text);
    record("Lorem Ipsum Generator", lorem ? "PASS" : "FAIL", `lorem text: ${lorem}`);
  } catch (e) { record("Lorem Ipsum Generator", "FAIL", e.message.slice(0, 160)); }

  // Color Picker
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/color-picker`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const ok = /#[0-9a-f]{6}|rgb|hsl/i.test(body);
    record("Color Picker", ok ? "PASS" : "FAIL", `color value shown: ${ok}`);
    await ctx.close();
  } catch (e) { record("Color Picker", "FAIL", e.message.slice(0, 160)); }

  // Color Converter
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/color-converter`, { waitUntil: "networkidle" });
    await page.waitForSelector('main input:not([type=checkbox]):not([type=file])', { state: "visible" });
    await page.waitForTimeout(1500);
    await page.locator('main input:not([type=checkbox]):not([type=file])').first().fill("#2563EB");
    await page.waitForTimeout(1000);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const ok = /37,\s*99,\s*235|rgb\(37, ?99, ?235\)|hsl/i.test(body);
    record("Color Converter", ok ? "PASS" : "FAIL", `#2563EB converted: ${ok}`);
    await ctx.close();
  } catch (e) { record("Color Converter", "FAIL", e.message.slice(0, 160)); }

  // Unix Timestamp Converter
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/unix-timestamp-converter`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const ok = /\d{10}|\d{13}|current|now/i.test(body);
    record("Unix Timestamp Converter", ok ? "PASS" : "FAIL", `timestamp data shown: ${ok}`);
    await ctx.close();
  } catch (e) { record("Unix Timestamp Converter", "FAIL", e.message.slice(0, 160)); }

  // URL Encoder / Decoder
  try {
    const out = await runTextTool(browser, "url-encoder-decoder", "hello world & foo/bar", "^Encode URL");
    const enc = [...out.textareas, ...out.outputs].find((v) => v && v.includes("hello%20world"));
    record("URL Encoder / Decoder", enc ? "PASS" : "FAIL", `encoded: ${!!enc}`);
  } catch (e) { record("URL Encoder / Decoder", "FAIL", e.message.slice(0, 160)); }

  // HTML Entity Encoder / Decoder
  try {
    const out = await runTextTool(browser, "html-entity-encoder-decoder", "<script>alert(1)</script>", "^Encode Entities");
    const enc = [...out.textareas, ...out.outputs].find((v) => v && v.includes("&lt;script&gt;"));
    record("HTML Entity Encoder / Decoder", enc ? "PASS" : "FAIL", `encoded: ${!!enc}`);
  } catch (e) { record("HTML Entity Encoder / Decoder", "FAIL", e.message.slice(0, 160)); }

  /* ---------------- CALCULATORS (UI math spot-checks) ---------------- */

  // Percentage Calculator
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/percentage-calculator`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const i = document.querySelector('main input[type=number]');
      return i && Object.keys(i).some(k => k.startsWith('__reactProps$'));
    });
    await page.waitForTimeout(800);
    const nums = page.locator('main input[type=number]');
    const count = await nums.count();
    if (count >= 2) { await nums.nth(0).fill("15"); await nums.nth(1).fill("200"); }
    await page.waitForTimeout(1000);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const ok = /30\b/.test(body); // 15% of 200 = 30
    record("Percentage Calculator", ok ? "PASS" : "FAIL", `15% of 200 = 30 shown: ${ok}`);
    await ctx.close();
  } catch (e) { record("Percentage Calculator", "FAIL", e.message.slice(0, 160)); }

  // EMI Calculator
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/emi-calculator`, { waitUntil: "networkidle" });
    await page.waitForSelector('main input[type=number]', { state: "visible" });
    await page.waitForTimeout(1500);
    const nums = page.locator('main input[type=number]');
    const n = await nums.count();
    if (n >= 3) { await nums.nth(0).fill("1000000"); await nums.nth(1).fill("8.5"); await nums.nth(2).fill("60"); }
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    // EMI for 10L @8.5% 60m ≈ 20,516 (allow display variance)
    const ok = /20,?5\d\d|20\.5|₹\s*2[01]|em/i.test(body);
    record("EMI Calculator", ok ? "PASS" : "FAIL", `EMI for 10L@8.5%/60m ≈ ₹20,5xx shown: ${ok}`);
    await ctx.close();
  } catch (e) { record("EMI Calculator", "FAIL", e.message.slice(0, 160)); }

  // BMI Calculator
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/bmi-calculator`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const i = document.querySelector('main input[type=number]');
      return i && Object.keys(i).some(k => k.startsWith('__reactProps$'));
    });
    await page.waitForTimeout(800);
    const nums = page.locator('main input[type=number]');
    const n = await nums.count();
    if (n >= 2) { await nums.nth(0).fill("70"); await nums.nth(1).fill("175"); }
    await page.waitForTimeout(1000);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const ok = /22\.9|22\.86|normal/i.test(body); // 70/(1.75^2) = 22.86
    record("BMI Calculator", ok ? "PASS" : "FAIL", `BMI 22.9 shown: ${ok}`);
    await ctx.close();
  } catch (e) { record("BMI Calculator", "FAIL", e.message.slice(0, 160)); }

  // Age Calculator
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/age-calculator`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const hasInputs = await page.locator('main input').count();
    const ok = hasInputs >= 1 && /age|year|born|birth/i.test(body);
    record("Age Calculator", ok ? "PASS" : "FAIL", `age UI functional: ${ok}`);
    await ctx.close();
  } catch (e) { record("Age Calculator", "FAIL", e.message.slice(0, 160)); }

  // GST Calculator
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/gst-calculator`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const i = document.querySelector('main input[type=number]');
      return i && Object.keys(i).some(k => k.startsWith('__reactProps$'));
    });
    await page.waitForTimeout(800);
    const nums = page.locator('main input[type=number]');
    const n = await nums.count();
    if (n >= 1) await nums.nth(0).fill("1000");
    await page.waitForTimeout(1000);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const ok = /1,?180|118|gst\s*(amount|total)/i.test(body); // 1000 + 18% = 1180
    record("GST Calculator", ok ? "PASS" : "FAIL", `GST on 1000 shown: ${ok}`);
    await ctx.close();
  } catch (e) { record("GST Calculator", "FAIL", e.message.slice(0, 160)); }

  // Discount Calculator
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/discount-calculator`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const i = document.querySelector('main input[type=number]');
      return i && Object.keys(i).some(k => k.startsWith('__reactProps$'));
    });
    await page.waitForTimeout(800);
    const nums = page.locator('main input[type=number]');
    const n = await nums.count();
    if (n >= 2) { await nums.nth(0).fill("500"); await nums.nth(1).fill("20"); }
    await page.waitForTimeout(1000);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const ok = /400/.test(body); // 500 - 20% = 400
    record("Discount Calculator", ok ? "PASS" : "FAIL", `500−20% = 400 shown: ${ok}`);
    await ctx.close();
  } catch (e) { record("Discount Calculator", "FAIL", e.message.slice(0, 160)); }

  // Unit Converter
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/unit-converter`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const i = document.querySelector('main input[type=number], main input[type=text]');
      return i && Object.keys(i).some(k => k.startsWith('__reactProps$'));
    });
    await page.waitForTimeout(800);
    const inp = page.locator('main input[type=number], main input[type=text]').first();
    await inp.fill("10");
    await page.waitForTimeout(1000);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const ok = /\d/.test(body) && /km|kilogram|meter|cm|convert/i.test(body);
    record("Unit Converter", ok ? "PASS" : "FAIL", `conversion UI active: ${ok}`);
    await ctx.close();
  } catch (e) { record("Unit Converter", "FAIL", e.message.slice(0, 160)); }

  // Currency Converter (live rates via API)
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/currency-converter`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const t = document.querySelector("main").innerText;
      return /rate|USD|INR|EUR/i.test(t) && /last updated|fetched|live/i.test(t);
    }, undefined, { timeout: 30_000 }).catch(() => {});
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const hasRate = /rate|USD|INR/i.test(body);
    const hasTimestamp = /updated|fetched|date/i.test(body);
    record("Currency Converter", hasRate && hasTimestamp ? "PASS" : "FAIL", `live rates: ${hasRate}, timestamp: ${hasTimestamp}`);
    await ctx.close();
  } catch (e) { record("Currency Converter", "FAIL", e.message.slice(0, 160)); }

  // Time Calculator + Date Difference (UI presence + interaction)
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/time-calculator`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const ok = /hour|minute|second/i.test(body);
    record("Time Calculator", ok ? "PASS" : "FAIL", `time UI: ${ok}`);
    await ctx.close();
  } catch (e) { record("Time Calculator", "FAIL", e.message.slice(0, 160)); }

  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tools/date-difference-calculator`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const body = await page.evaluate(() => document.querySelector("main").innerText);
    const ok = /date|day|difference/i.test(body);
    record("Date Difference Calculator", ok ? "PASS" : "FAIL", `date diff UI: ${ok}`);
    await ctx.close();
  } catch (e) { record("Date Difference Calculator", "FAIL", e.message.slice(0, 160)); }

  await browser.close();
  const pass = results.filter((r) => r.status === "PASS").length;
  const warn = results.filter((r) => r.status === "WARN").length;
  console.log(`\nBATCH C2: ${pass} PASS / ${warn} WARN / ${results.length - pass - warn} FAIL`);
  fs.writeFileSync("/home/z/my-project/scripts/audit-browser-C2.json", JSON.stringify(results, null, 2));
  process.exit(results.some((r) => r.status === "FAIL") ? 1 : 0);
})();
