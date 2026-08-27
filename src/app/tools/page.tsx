import type { Metadata } from "next";
import { ToolBrowser } from "@/components/tools/tool-browser";
import { ALL_TOOLS } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "All Tools — 100+ Free Online Utilities",
  description:
    "Browse all 100+ free online tools: PDF, image, document, file, developer, generator and calculator utilities. Fast, private and free — no sign-up.",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <div className="container-page py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">All Tools</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          {ALL_TOOLS.length} free utilities for files, documents, code and calculations — search or filter below.
        </p>
      </header>
      <ToolBrowser tools={ALL_TOOLS} />
    </div>
  );
}
