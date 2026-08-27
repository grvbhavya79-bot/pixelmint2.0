import { PDF_TOOLS } from "./data/pdf";
import { IMAGE_TOOLS } from "./data/image";
import { DOCUMENT_TOOLS } from "./data/document";
import { FILE_TOOLS } from "./data/file";
import { DEVELOPER_TOOLS } from "./data/developer";
import { GENERATOR_TOOLS } from "./data/generators";
import { CALCULATOR_TOOLS } from "./data/calculators";
import { CATEGORY_BY_ID, CATEGORIES } from "./categories";
import type { ToolCategoryId, ToolDefinition, ToolFaq } from "./types";

export * from "./types";
export { CATEGORIES, CATEGORY_BY_ID, CATEGORY_BY_SLUG } from "./categories";

/** All 100 tools, in canonical order. */
export const ALL_TOOLS: ToolDefinition[] = [
  ...PDF_TOOLS,
  ...IMAGE_TOOLS,
  ...DOCUMENT_TOOLS,
  ...FILE_TOOLS,
  ...DEVELOPER_TOOLS,
  ...GENERATOR_TOOLS,
  ...CALCULATOR_TOOLS,
];

const BY_SLUG = new Map<string, ToolDefinition>(ALL_TOOLS.map((t) => [t.slug, t]));
const BY_CATEGORY = new Map<ToolCategoryId, ToolDefinition[]>(
  CATEGORIES.map((c) => [c.id, ALL_TOOLS.filter((t) => t.category === c.id)]),
);

export function getTool(slug: string): ToolDefinition | undefined {
  return BY_SLUG.get(slug);
}

export function getToolsByCategory(category: ToolCategoryId): ToolDefinition[] {
  return BY_CATEGORY.get(category) ?? [];
}

export function getPopularTools(): ToolDefinition[] {
  return ALL_TOOLS.filter((t) => t.popular);
}

/** Small helpers --------------------------------------------------------- */

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s_-]+/g, " ").trim();
}

/** Instant search over name, description, tags and category. */
export function searchTools(query: string, limit = 24): ToolDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/);
  const scored: { tool: ToolDefinition; score: number }[] = [];

  for (const tool of ALL_TOOLS) {
    const name = tool.name.toLowerCase();
    const desc = tool.description.toLowerCase();
    const tags = tool.tags.join(" ").toLowerCase();
    const cat = CATEGORY_BY_ID[tool.category].name.toLowerCase();
    let score = 0;
    for (const w of words) {
      let hit = 0;
      if (name.startsWith(w)) hit += 8;
      else if (name.includes(w)) hit += 5;
      if (tags.includes(w)) hit += 3;
      if (desc.includes(w)) hit += 2;
      if (cat.includes(w)) hit += 1;
      if (normalize(tool.slug).includes(w)) hit += 2;
      if (hit === 0) {
        score = -1;
        break;
      }
      score += hit;
    }
    if (score > 0) scored.push({ tool, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.tool);
}

/** Related tools: same category first, then shared tags. */
export function getRelatedTools(tool: ToolDefinition, count = 4): ToolDefinition[] {
  const scored = ALL_TOOLS.filter((t) => t.slug !== tool.slug).map((t) => {
    let score = 0;
    if (t.category === tool.category) score += 4;
    score += t.tags.filter((tag) => tool.tags.includes(tag)).length * 2;
    if (t.popular) score += 0.5;
    return { tool: t, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((s) => s.tool);
}

/**
 * Default FAQ generator — produces genuinely useful, tool-specific answers
 * from the tool's own metadata when no handwritten FAQ exists.
 */
export function getFaqs(tool: ToolDefinition): ToolFaq[] {
  const local = tool.process === "local";
  const cat = CATEGORY_BY_ID[tool.category].name.replace(" Tools", "");
  const faqs: ToolFaq[] = [
    {
      q: `How do I use the ${tool.name} tool?`,
      a: `Open the ${tool.name} tool, ${
        tool.process === "server"
          ? "enter or provide your input"
          : "upload your file or paste your input"
      }, adjust the available options to your needs, then run the tool and ${
        tool.process === "server" ? "review the result" : "download or copy the result"
      }. No account or installation is required.`,
    },
    {
      q: `Is ${tool.name} free to use?`,
      a: `Yes. ${tool.name} is one of the 100 tools on ToolBox100 and it is completely free, with no sign-up, no watermarks and no usage quotas on the tool itself.`,
    },
    {
      q: local
        ? `Are my files safe with the ${tool.name} tool?`
        : `Where is my data processed in the ${tool.name} tool?`,
      a: local
        ? `Your input is processed entirely inside your own browser using client-side technology — files are never uploaded to a server, so they never leave your device.`
        : `This tool talks to a secure server endpoint that handles only the minimum data needed to produce your result, and processed data is not retained.`,
    },
    {
      q: `Can I use ${tool.name} on my phone?`,
      a: `Yes. ToolBox100 is fully responsive — this ${cat.toLowerCase()} tool works on phones, tablets and desktops, and client-side tools even work without an internet connection once loaded.`,
    },
  ];
  // Merge custom FAQs first; top up with generated ones so every tool has >= 3.
  const custom = tool.faqs ?? [];
  const combined = [...custom];
  for (const generated of faqs) {
    if (combined.length >= 3) break;
    if (!custom.some((c) => c.q === generated.q)) combined.push(generated);
  }
  return combined;
}

export const TOTAL_TOOLS = ALL_TOOLS.length;
