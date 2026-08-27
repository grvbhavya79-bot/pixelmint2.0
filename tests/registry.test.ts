import { describe, expect, test } from "bun:test";
import { ALL_TOOLS, getTool, searchTools, getRelatedTools, getFaqs } from "@/lib/tools/registry";
import { CATEGORIES } from "@/lib/tools/categories";
import { TOOL_COMPONENTS } from "@/components/tools/registry-components";

describe("tool registry integrity", () => {
  test("contains more than 100 tools", () => {
    expect(ALL_TOOLS.length).toBeGreaterThanOrEqual(100);
    expect(ALL_TOOLS.length).toBe(103);
  });

  test("has unique slugs", () => {
    const slugs = ALL_TOOLS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("every category has the promised tool count", () => {
    const counts = {
      pdf: 25,
      image: 20,
      document: 10,
      file: 10,
      developer: 15,
      generators: 10,
      calculators: 10,
      ai: 3,
    };
    for (const [id, expected] of Object.entries(counts)) {
      const actual = ALL_TOOLS.filter((t) => t.category === id).length;
      expect(actual).toBe(expected);
    }
  });

  test("every tool maps to a registered component", () => {
    for (const tool of ALL_TOOLS) {
      expect(TOOL_COMPONENTS[tool.component]).toBeDefined();
    }
  });

  test("every tool has required metadata", () => {
    for (const tool of ALL_TOOLS) {
      expect(tool.name.length).toBeGreaterThan(2);
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.tags.length).toBeGreaterThan(0);
      expect(tool.icon.length).toBeGreaterThan(0);
      expect(["local", "server"]).toContain(tool.process);
    }
  });

  test("getTool resolves slugs", () => {
    expect(getTool("merge-pdf")?.name).toBe("Merge PDF");
    expect(getTool("currency-converter")?.process).toBe("server");
    expect(getTool("does-not-exist")).toBeUndefined();
  });

  test("search finds relevant tools", () => {
    const compress = searchTools("compress").map((t) => t.slug);
    expect(compress).toContain("compress-pdf");
    expect(compress).toContain("image-compressor");
    expect(compress).toContain("file-compressor");

    const jpg = searchTools("jpg").map((t) => t.slug);
    expect(jpg).toContain("pdf-to-jpg");
    expect(jpg).toContain("jpg-to-pdf");
    expect(jpg).toContain("jpg-to-png");
    expect(jpg).toContain("jpg-to-webp");
    expect(jpg).toContain("webp-to-jpg");
  });

  test("related tools exclude self and share context", () => {
    const merge = getTool("merge-pdf")!;
    const related = getRelatedTools(merge);
    expect(related.every((r) => r.slug !== "merge-pdf")).toBe(true);
    expect(related.some((r) => r.category === "pdf")).toBe(true);
  });

  test("every tool gets FAQs", () => {
    for (const tool of ALL_TOOLS) {
      const faqs = getFaqs(tool);
      expect(faqs.length).toBeGreaterThanOrEqual(2);
      for (const faq of faqs) {
        expect(faq.q.length).toBeGreaterThan(5);
        expect(faq.a.length).toBeGreaterThan(30);
      }
    }
  });

  test("categories match registry counts", () => {
    expect(CATEGORIES.length).toBe(8);
    expect(CATEGORIES.map((c) => c.slug)).toEqual([
      "pdf-tools",
      "image-tools",
      "document-tools",
      "file-tools",
      "developer-tools",
      "generators-and-utilities",
      "calculators",
      "ai-tools",
    ]);
  });

  test("AI tools resolve to the shared AI component and server processing", () => {
    const aiTools = ALL_TOOLS.filter((t) => t.category === "ai");
    expect(aiTools.length).toBe(3);
    for (const tool of aiTools) {
      expect(tool.component).toBe("AiTool");
      expect(tool.process).toBe("server");
      expect(tool.props?.task).toMatch(/^(summarize|improve|ideas)$/);
    }
  });
});
