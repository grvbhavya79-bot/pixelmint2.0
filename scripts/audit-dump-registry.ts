/**
 * Audit script: dump the full 100-tool table from the registry.
 * Run: bunx tsx scripts/audit-dump-registry.ts (or bun run)
 */
import { ALL_TOOLS, CATEGORIES, CATEGORY_BY_ID } from "../src/lib/tools/registry";

console.log("TOTAL:", ALL_TOOLS.length);
console.log("");
console.log("| # | Tool | Slug | Category | Process | Component |");
console.log("|---|------|------|----------|---------|-----------|");
ALL_TOOLS.forEach((t, i) => {
  console.log(
    `| ${i + 1} | ${t.name} | ${t.slug} | ${CATEGORY_BY_ID[t.category].shortName} | ${t.process} | ${t.component} |`,
  );
});
console.log("");
const byCat = CATEGORIES.map((c) => {
  const n = ALL_TOOLS.filter((t) => t.category === c.id).length;
  return `${c.name}: ${n}`;
});
console.log(byCat.join("\n"));
const slugs = ALL_TOOLS.map((t) => t.slug);
const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
console.log("Duplicate slugs:", dupes.length ? dupes : "none");
const names = ALL_TOOLS.map((t) => t.name);
const dupNames = names.filter((s, i) => names.indexOf(s) !== i);
console.log("Duplicate names:", dupNames.length ? dupNames : "none");
