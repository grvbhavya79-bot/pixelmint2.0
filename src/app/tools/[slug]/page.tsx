import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CircleCheck } from "lucide-react";
import { ALL_TOOLS, getTool, getFaqs, getRelatedTools } from "@/lib/tools/registry";
import { CATEGORY_BY_ID } from "@/lib/tools/categories";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import { ToolIcon } from "@/components/tools/tool-icon";
import { ToolCard } from "@/components/tools/tool-card";
import { FavoriteButton } from "@/components/tools/favorite-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ALL_TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  const title = `${tool.name} Online Free — ToolBox100`;
  const description = tool.longDescription
    ? `${tool.longDescription.slice(0, 155).trim()}. Free, no sign-up.`
    : `${tool.description} Free online tool by ToolBox100 — fast, simple and easy to use.`;
  return {
    title,
    description,
    keywords: [tool.name.toLowerCase(), ...tool.tags, "online free tool", "toolbox100"],
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: {
      title,
      description: tool.description,
      url: `/tools/${tool.slug}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description: tool.description },
  };
}

const HOW_TO_STEPS = [
  "Upload or provide your input",
  "Adjust the available options to your needs",
  "Click the main action button",
  "Wait a moment while the tool processes",
  "Download or copy your result",
];

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const category = CATEGORY_BY_ID[tool.category];
  const faqs = getFaqs(tool);
  const related = getRelatedTools(tool, 4);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `${tool.name} — ToolBox100`,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any (web browser)",
      url: `${siteUrl}/tools/${tool.slug}`,
      description: tool.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to use ${tool.name}`,
      step: HOW_TO_STEPS.map((step, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        text: step,
      })),
    },
  ];

  return (
    <div className="container-page py-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-primary">Home</Link></li>
          <li aria-hidden="true"><ChevronRight size={12} /></li>
          <li><Link href="/tools" className="hover:text-primary">Tools</Link></li>
          <li aria-hidden="true"><ChevronRight size={12} /></li>
          <li>
            <Link href={`/categories/${category.slug}`} className="hover:text-primary">{category.name}</Link>
          </li>
          <li aria-hidden="true"><ChevronRight size={12} /></li>
          <li aria-current="page" className="font-medium text-foreground">{tool.name}</li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className={cn("flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", category.gradient)}>
            <ToolIcon name={tool.icon} size={26} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{tool.name}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {tool.longDescription ?? tool.description}
            </p>
          </div>
        </div>
        <FavoriteButton slug={tool.slug} name={tool.name} />
      </header>

      {/* Workspace */}
      <ToolWorkspace tool={tool} />

      {/* How to use */}
      <section className="mt-10" aria-labelledby="how-to-heading">
        <h2 id="how-to-heading" className="text-lg font-bold text-foreground">How to use {tool.name}</h2>
        <ol className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {HOW_TO_STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-2.5 rounded-xl border bg-card p-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                {i + 1}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="mt-10" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-lg font-bold text-foreground">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="mt-3 rounded-2xl border bg-card px-5">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-b last:border-b-0">
              <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Related tools */}
      <section className="mt-10" aria-labelledby="related-heading">
        <h2 id="related-heading" className="text-lg font-bold text-foreground">Related tools</h2>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CircleCheck size={12} className="text-success" /> Suggested from shared category and tags
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((rel) => (
            <ToolCard key={rel.slug} tool={rel} />
          ))}
        </div>
      </section>
    </div>
  );
}
