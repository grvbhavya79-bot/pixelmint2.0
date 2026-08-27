import type { CategoryInfo, ToolCategoryId } from "./types";

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "pdf",
    slug: "pdf-tools",
    name: "PDF Tools",
    shortName: "PDF",
    description:
      "Merge, split, compress, convert, rotate, watermark, sign and protect PDF files — 25 complete PDF utilities.",
    icon: "FileText",
    gradient: "from-red-500 to-rose-600",
    chip: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  },
  {
    id: "image",
    slug: "image-tools",
    name: "Image Tools",
    shortName: "Image",
    description:
      "Compress, resize, crop, convert and enhance JPG, PNG, WEBP, GIF and BMP images — 20 image utilities.",
    icon: "Image",
    gradient: "from-violet-500 to-purple-600",
    chip: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  },
  {
    id: "document",
    slug: "document-tools",
    name: "Document & Text Tools",
    shortName: "Document",
    description:
      "Count words, convert case, clean up text and turn content into clean PDF or DOCX files — 10 utilities.",
    icon: "FileType",
    gradient: "from-emerald-500 to-teal-600",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  {
    id: "file",
    slug: "file-tools",
    name: "File Tools",
    shortName: "File",
    description:
      "Create and extract ZIP archives, rename batches, inspect files, encode data and generate QR codes — 10 utilities.",
    icon: "FolderArchive",
    gradient: "from-amber-500 to-orange-600",
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  },
  {
    id: "developer",
    slug: "developer-tools",
    name: "Developer Tools",
    shortName: "Developer",
    description:
      "Format, validate and minify JSON, XML, HTML, CSS, JavaScript and SQL, plus regex testing and UUIDs — 15 utilities.",
    icon: "Code2",
    gradient: "from-blue-500 to-indigo-600",
    chip: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  },
  {
    id: "generators",
    slug: "generators-and-utilities",
    name: "Generators & Utilities",
    shortName: "Generators",
    description:
      "Passwords, random data, lorem ipsum, QR reading, colors, timestamps and a full URL shortener — 10 utilities.",
    icon: "Wand2",
    gradient: "from-pink-500 to-fuchsia-600",
    chip: "bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
  },
  {
    id: "calculators",
    slug: "calculators",
    name: "Calculators",
    shortName: "Calculators",
    description:
      "Percentages, age, BMI, EMI, GST, discounts, time, dates, units and live currency conversion — 10 calculators.",
    icon: "Calculator",
    gradient: "from-cyan-500 to-sky-600",
    chip: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
  },
  {
    id: "ai",
    slug: "ai-tools",
    name: "AI Tools",
    shortName: "AI",
    description:
      "Summarize long text, polish your writing and brainstorm fresh ideas with fast, free AI helpers — 3 smart utilities.",
    icon: "Sparkles",
    gradient: "from-emerald-400 to-teal-500",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
];

export const CATEGORY_BY_ID: Record<ToolCategoryId, CategoryInfo> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<ToolCategoryId, CategoryInfo>;

export const CATEGORY_BY_SLUG: Record<string, CategoryInfo> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);

export function categoryCount(id: ToolCategoryId, tools: { category: ToolCategoryId }[]): number {
  return tools.filter((t) => t.category === id).length;
}
