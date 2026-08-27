import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { CATEGORIES } from "@/lib/tools/categories";
import { ALL_TOOLS, getTool } from "@/lib/tools/registry";

const POPULAR_FOOTER = [
  { slug: "merge-pdf", label: "Merge PDF" },
  { slug: "compress-pdf", label: "Compress PDF" },
  { slug: "pdf-to-word", label: "PDF to Word" },
  { slug: "word-to-pdf", label: "Word to PDF" },
  { slug: "image-compressor", label: "Image Compressor" },
  { slug: "background-remover", label: "Remove Background" },
  { slug: "qr-code-generator", label: "QR Code Generator" },
  { slug: "password-generator", label: "Password Generator" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-card">
      <div className="container-page py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" aria-label="Pixelmint.fun home">
              <Logo size={34} />
            </Link>
            <p className="mt-4 max-w-xs text-sm font-medium text-foreground">
              Every tool. One smart place.
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {ALL_TOOLS.length}+ free online tools for PDFs, images, files, text, productivity, developers and more — fast, private and easy.
            </p>
            <Link
              href="/tools"
              className="focus-ring mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-mint transition-all hover:bg-primary/90"
            >
              Explore all tools →
            </Link>
          </div>

          <nav aria-label="Tool categories">
            <h2 className="text-sm font-semibold text-foreground">Categories</h2>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/categories/${cat.slug}`} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Popular tools">
            <h2 className="text-sm font-semibold text-foreground">Popular Tools</h2>
            <ul className="mt-4 space-y-2.5">
              {POPULAR_FOOTER.map((item) => {
                const tool = getTool(item.slug);
                return (
                  <li key={item.slug}>
                    <Link
                      href={`/tools/${item.slug}`}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav aria-label="Company links">
            <h2 className="text-sm font-semibold text-foreground">Company</h2>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact" },
                { href: "/blog", label: "Blog" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
                { href: "/cookies", label: "Cookie Policy" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">© 2026 Pixelmint.fun. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">
            Independent platform by Grv Bhavya · Files are processed in your browser whenever possible.
          </p>
        </div>
      </div>
    </footer>
  );
}
