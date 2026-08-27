"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChevronDown,
  Code2,
  FolderOutput,
  Mail,
  Menu,
  Monitor,
  Moon,
  Search,
  Sparkles,
  Star,
  Sun,
  Type,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { SearchDialog } from "@/components/layout/search-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Primary nav — short labels, always visible on desktop. */
const PRIMARY_NAV = [
  { href: "/tools", label: "All Tools" },
  { href: "/categories/pdf-tools", label: "PDF" },
  { href: "/categories/image-tools", label: "Image" },
  { href: "/categories/ai-tools", label: "AI" },
  { href: "/blog", label: "Blog" },
];

/** Secondary nav — grouped inside the "More" dropdown. */
const MORE_NAV = [
  {
    href: "/categories/file-tools",
    label: "File Converters",
    description: "Archive, encode & convert files",
    icon: FolderOutput,
  },
  {
    href: "/categories/document-tools",
    label: "Text Tools",
    description: "Case, count, format & clean text",
    icon: Type,
  },
  {
    href: "/categories/developer-tools",
    label: "Developer",
    description: "Formatters, minifiers & testers",
    icon: Code2,
  },
  {
    href: "/categories/generators-and-utilities",
    label: "Productivity",
    description: "Generators & everyday utilities",
    icon: Sparkles,
  },
  {
    href: "/about",
    label: "About Us",
    description: "The story behind Pixelmint",
    icon: UserRound,
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Support, feedback & requests",
    icon: Mail,
  },
];

const MOBILE_GROUPS = [
  {
    title: "Browse",
    items: [
      { href: "/tools", label: "All Tools" },
      { href: "/popular", label: "Popular Tools" },
      { href: "/favorites", label: "Favorites" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Categories",
    items: [
      { href: "/categories/pdf-tools", label: "PDF Tools" },
      { href: "/categories/image-tools", label: "Image Tools" },
      { href: "/categories/ai-tools", label: "AI Tools" },
      { href: "/categories/file-tools", label: "File Converters" },
      { href: "/categories/document-tools", label: "Text Tools" },
      { href: "/categories/developer-tools", label: "Developer" },
      { href: "/categories/generators-and-utilities", label: "Productivity" },
    ],
  },
  {
    title: "Company",
    items: [
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href !== "/" && pathname.startsWith(href);
}

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

  const moreActive = MORE_NAV.some((item) => isActive(pathname, item.href));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-lg supports-[backdrop-filter]:bg-background/75">
      <div className="container-page flex h-16 items-center gap-2 lg:gap-3">
        <Link href="/" className="focus-ring shrink-0 rounded-lg" aria-label="Pixelmint.fun home">
          <Logo size={34} />
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(pathname, item.href)
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "focus-ring group flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors data-[state=open]:bg-muted",
                moreActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              More
              <ChevronDown
                size={14}
                className="transition-transform group-data-[state=open]:rotate-180"
                aria-hidden="true"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 rounded-xl p-2 shadow-lg">
              {MORE_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "group/item flex w-full items-center gap-3 rounded-lg px-2.5 py-2",
                        isActive(pathname, item.href) && "bg-secondary",
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon size={15} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">{item.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search tools"
            className="focus-ring group hidden h-9 items-center gap-2 rounded-full border bg-card px-3.5 text-muted-foreground transition-all hover:border-primary/50 hover:shadow-mint md:flex md:w-44 xl:w-52"
          >
            <Search size={15} className="shrink-0 text-primary" />
            <span className="hidden truncate text-sm md:inline">Search tools…</span>
            <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground lg:inline">
              Ctrl K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search tools"
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:text-foreground md:hidden"
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
          <div className="container-page max-h-[calc(100dvh-4rem)] space-y-4 overflow-y-auto py-4">
            {MOBILE_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "focus-ring rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted",
                        isActive(pathname, item.href) && "bg-secondary",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>
      )}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
