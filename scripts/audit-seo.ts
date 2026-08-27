/**
 * SEO audit: verify unique metadata, canonical, OG, JSON-LD on all 100 tool pages
 * plus sitemap and robots correctness.
 */
const BASE = "http://localhost:3000";
const { ALL_TOOLS } = require("/home/z/my-project/src/lib/tools/registry.ts");

async function fetchPage(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, html: await res.text() };
}

function extract(pattern, html) {
  const m = html.match(pattern);
  return m ? m[1] : null;
}

(async () => {
  const issues = [];
  const titles = new Map();
  const descriptions = new Map();

  for (const tool of ALL_TOOLS) {
    const { status, html } = await fetchPage(`/tools/${tool.slug}`);
    if (status !== 200) { issues.push(`${tool.slug}: HTTP ${status}`); continue; }

    const title = extract(/<title>([^<]+)<\/title>/, html);
    const desc = extract(/<meta\s+name="description"\s+content="([^"]*)"/, html);
    const canonical = extract(/<link\s+rel="canonical"\s+href="([^"]*)"/, html);
    const ogTitle = extract(/<meta\s+property="og:title"\s+content="([^"]*)"/, html);
    const ogDesc = extract(/<meta\s+property="og:description"\s+content="([^"]*)"/, html);
    const jsonLdCount = (html.match(/application\/ld\+json/g) || []).length;
    const hasH1 = /<h1[^>]*>/.test(html);

    if (!title) issues.push(`${tool.slug}: missing <title>`);
    else {
      if (!title.toLowerCase().includes(tool.name.toLowerCase().split(" ")[0])) issues.push(`${tool.slug}: title mismatch "${title}"`);
      if (titles.has(title)) issues.push(`${tool.slug}: DUPLICATE title with ${titles.get(title)}: "${title}"`);
      titles.set(title, tool.slug);
    }
    if (!desc) issues.push(`${tool.slug}: missing meta description`);
    else {
      if (desc.length < 50 || desc.length > 320) issues.push(`${tool.slug}: description length ${desc.length}`);
      if (descriptions.has(desc)) issues.push(`${tool.slug}: DUPLICATE description with ${descriptions.get(desc)}`);
      descriptions.set(desc, tool.slug);
    }
    if (!canonical || !canonical.includes(tool.slug)) issues.push(`${tool.slug}: canonical missing/wrong: ${canonical}`);
    if (!ogTitle) issues.push(`${tool.slug}: missing og:title`);
    if (!ogDesc) issues.push(`${tool.slug}: missing og:description`);
    if (jsonLdCount < 1) issues.push(`${tool.slug}: no JSON-LD structured data`);
    if (!hasH1) issues.push(`${tool.slug}: no H1`);
  }

  // sitemap
  const sm = await fetchPage("/sitemap.xml");
  const urls = (sm.html.match(/<loc>([^<]+)<\/loc>/g) || []).map((l) => l.replace(/<\/?loc>/g, ""));
  const toolUrls = urls.filter((u) => u.includes("/tools/"));
  const missingInSitemap = ALL_TOOLS.filter((t) => !urls.some((u) => u.endsWith(`/tools/${t.slug}`)));
  console.log(`SITEMAP: ${urls.length} URLs total, ${toolUrls.length} tool URLs`);
  if (missingInSitemap.length) issues.push(`sitemap missing ${missingInSitemap.length} tools: ${missingInSitemap.slice(0, 5).map((t) => t.slug).join(", ")}`);

  // robots
  const rb = await fetchPage("/robots.txt");
  if (!/sitemap:/i.test(rb.html)) issues.push("robots.txt missing Sitemap directive");
  if (!/user-agent:/i.test(rb.html)) issues.push("robots.txt missing User-agent");
  console.log("ROBOTS:", rb.status, JSON.stringify(rb.html.split("\n").filter(Boolean).slice(0, 5)));

  console.log(`\n=== SEO AUDIT: ${issues.length} issues ===`);
  issues.slice(0, 30).forEach((i) => console.log(" -", i));
  if (!issues.length) console.log("ALL CLEAN: 100 unique titles, 100 unique descriptions, canonicals, OG, JSON-LD, H1s, sitemap complete");
})();
