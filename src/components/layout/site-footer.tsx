import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { CATEGORIES } from "@/lib/tools/categories";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-card">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" aria-label="ToolBox100 home">
              <Logo size={34} />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              100 powerful online tools for everyday tasks — free, fast and privacy-friendly.
            </p>
          </div>

          <nav aria-label="Tool categories">
            <h2 className="text-sm font-semibold text-foreground">Tools</h2>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/categories/${cat.slug}`} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company links">
            <h2 className="text-sm font-semibold text-foreground">Company</h2>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
                { href: "/popular", label: "Popular Tools" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Contact</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href="mailto:grvbhavya79@gmail.com" className="transition-colors hover:text-primary">
                  grvbhavya79@gmail.com
                </a>
              </li>
              <li>Madhubani, Bihar, India</li>
              <li className="pt-2">
                <Link
                  href="/tools"
                  className="inline-flex rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70"
                >
                  Browse all 100 tools →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">© 2026 ToolBox100. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">
            Independent platform by Grv Bhavya · Files are processed in your browser whenever possible.
          </p>
        </div>
      </div>
    </footer>
  );
}
