/** Checks that every icon name used by the tool registry exists in lucide-react. */
import * as lucide from "lucide-react";
import { ALL_TOOLS } from "../src/lib/tools/registry";
import { CATEGORIES } from "../src/lib/tools/categories";

let missing = 0;
const names = new Set<string>([...ALL_TOOLS.map((t) => t.icon), ...CATEGORIES.map((c) => c.icon)]);
for (const name of names) {
  // PascalCase icon names are exported as-is
  const exists = name in lucide;
  if (!exists) {
    console.error(`MISSING: ${name} (used by: ${ALL_TOOLS.filter((t) => t.icon === name).map((t) => t.slug).join(", ")})`);
    missing++;
  }
}
if (missing === 0) {
  console.log(`All ${names.size} icon names exist in lucide-react.`);
} else {
  console.error(`${missing} of ${names.size} icons missing.`);
  process.exit(1);
}
