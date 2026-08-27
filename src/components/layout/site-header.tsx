"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Monitor, Moon, Search, Star, Sun, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { SearchDialog } from "@/components/layout/search-dialog";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/tools", label: "All Tools" },
  { href: "/categories/pdf-tools", label: "PDF Tools" },
  { href: "/categories/image-tools", label: "Image Tools" },
  { href: "/categories/ai-tools", label: "AI Tools" },
  { href: "/blog", label: "Blog", hideBelow: "lg" },
  { href: "/categories/file-tools", label: "File Converters", hideBelow: "xl" },
  { href: "/categories/developer-tools", label: "Developer", hideBelow: "xl" },
  { href: "/categories/document-tools", label: "Text Tools", hideBelow: "2xl" },
  { href: "/categories/generators-and-utilities", label: "Productivity", hideBelow: "2xl" },
  { href: "/about", label: "About Us", hideBelow: "2xl" },
  { href: "/contact", label: "Contact", hideBelow: "2xl" },
];

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const cycle = () => {
    const current = mounted ? (theme === "system" ? resolvedTheme : theme) : "system";
    if (current === "dark") setTheme("system");
    else if (current === "system") setTheme("light");
    else setTheme("dark");
  };

  const label = `Theme: ${mounted ? theme : "system"} — click to change`;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:text-foreground"
    >
      {!mounted ? (
        <Monitor size={16} />
      ) : theme === "dark" ? (
        <Moon size={16} />
      ) : theme === "light" ? (
        <Sun size={16} />
      ) : (
        <Monitor size={16} />
      )}
    </button>
  );
}

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close mobile menu on navigation
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (e.key === "/" && document.activeElement instanceof HTMLInputElement) return;
        if (e.key === "k" && document.activeElement instanceof HTMLInputElement) return;
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-lg supports-[backdrop-filter]:bg-background/75">
      <div className="container-page flex h-16 items-center gap-3 lg:gap-4">
        <Link href="/" className="focus-ring rounded-lg" aria-label="Pixelmint.fun home">
          <Logo size={34} />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                item.hideBelow === "2xl" && "hidden 2xl:inline-block",
                item.hideBelow === "xl" && "hidden xl:inline-block",
                item.hideBelow === "lg" && "hidden lg:inline-block",
                pathname.startsWith(item.href) && item.href !== "/"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search tools"
            className="focus-ring group hidden h-9 items-center gap-2 rounded-full border bg-card px-3.5 text-muted-foreground transition-all hover:border-primary/50 hover:shadow-mint sm:flex md:w-48 xl:w-56"
          >
            <Search size={15} className="shrink-0 text-primary" />
            <span className="hidden truncate text-sm md:inline">What do you want to do today?</span>
            <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground lg:inline">Ctrl K</kbd>
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search tools"
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:text-foreground sm:hidden"
          >
            <Search size={16} />
          </button>

          <Link
            href="/favorites"
            aria-label="Your favorite tools"
            className="focus-ring hidden h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            <Star size={16} />
          </Link>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground lg:hidden"
          >
            {mobileOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          className="border-t bg-background lg:hidden"
        >
          <div className="container-page flex max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/favorites"
              className="focus-ring rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Favorites
            </Link>
            <Link
              href="/popular"
              className="focus-ring rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Popular Tools
            </Link>
          </div>
        </nav>
      )}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
