export type ToolCategoryId =
  | "pdf"
  | "image"
  | "document"
  | "file"
  | "developer"
  | "generators"
  | "calculators";

export interface ToolFaq {
  q: string;
  a: string;
}

export interface ToolDefinition {
  /** URL slug — /tools/<slug> */
  slug: string;
  /** Display name */
  name: string;
  category: ToolCategoryId;
  /** Short description used on cards & meta descriptions */
  description: string;
  /** Longer intro shown on the tool page */
  longDescription?: string;
  /** Search keywords */
  tags: string[];
  /** Mark as a popular tool */
  popular?: boolean;
  /** Custom FAQs (a smart default is generated when omitted) */
  faqs?: ToolFaq[];
  /** Component key resolved in src/components/tools/registry-components.tsx */
  component: string;
  /** Parameters passed to the shared component */
  props?: Record<string, unknown>;
  /** Where the heavy processing happens */
  process: "local" | "server";
  /** lucide icon name (see tool-icon.tsx) */
  icon: string;
}

export interface CategoryInfo {
  id: ToolCategoryId;
  /** URL slug — /categories/<slug> */
  slug: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  /** Tailwind gradient classes for the category tile */
  gradient: string;
  /** Soft background + foreground for chips */
  chip: string;
}
