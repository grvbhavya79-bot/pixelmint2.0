"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Monitor, Moon, Search, Star, Sun, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { SearchDialog } from "@/components/layout/search-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/tools", label: "Tools" },
  { href: "/categories", label: "Categories" },
  { href: "/popular", label: "Popular" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="focus-ring rounded-lg" aria-label="ToolBox100 home">
          <Logo size={32} />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
            className="focus-ring group flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Search size={15} />
            <span className="hidden text-sm md:inline">Search tools…</span>
            <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground md:inline">Ctrl K</kbd>
          </button>

          <Link
            href="/favorites"
            aria-label="Your favorite tools"
            className="focus-ring hidden h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            <Star size={16} />
          </Link>

          <ThemeToggle />

          <Button
            asChild
            size="sm"
            className="hidden bg-primary text-primary-foreground hover:bg-primary/90 lg:inline-flex"
          >
            <Link href="/tools">Explore Tools</Link>
          </Button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground lg:hidden"
          >
            {mobileOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav aria-label="Mobile navigation" className="border-t bg-background lg:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {[...NAV, { href: "/favorites", label: "Favorites" }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
