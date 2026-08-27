"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";

const LINKS = [
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "Studio", href: "#studio" },
  { label: "Contact", href: "#contact" },
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/pixelmintfun" },
  { label: "LinkedIn", href: "https://linkedin.com/company/pixelmintfun" },
  { label: "Behance", href: "https://behance.net/pixelmintfun" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "pm-nav-glass border-b border-white/5"
          : "border-b border-transparent"
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 md:h-[76px] lg:px-10"
      >
        <a
          href="#top"
          className="pm-focus group flex items-center gap-2.5"
          aria-label="Pixelmint.fun — back to top"
        >
          <BrandMark className="h-8 w-8 transition-transform duration-500 group-hover:rotate-90" />
          <span className="font-display text-lg font-bold tracking-tight text-pm-paper">
            pixelmint<span className="text-pm-mint">.fun</span>
          </span>
        </a>

        <ul className="hidden items-center gap-9 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="pm-nav-link pm-focus py-1">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <a href="#contact" className="pm-btn-mint pm-focus">
            Start a project
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          className="pm-focus flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-pm-paper md:hidden"
          aria-expanded={open}
          aria-controls="pm-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="pm-mobile-menu"
            className="fixed inset-0 top-16 z-40 flex flex-col bg-[#080A0A]/[0.985] backdrop-blur-xl md:hidden"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <ul className="flex flex-col gap-2 px-6 py-10">
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.06, duration: 0.35 }}
                >
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="pm-focus flex items-baseline gap-4 py-3 font-display text-4xl font-bold tracking-tight text-pm-paper transition-colors hover:text-pm-mint"
                  >
                    <span className="font-mono text-xs text-pm-mint">
                      0{i + 1}
                    </span>
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>

            <motion.div
              className="mt-auto space-y-6 px-6 pb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="pm-btn-mint pm-focus w-full"
              >
                Start a project
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <ul className="flex items-center gap-6 text-sm text-pm-mute">
                {SOCIALS.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="pm-focus transition-colors hover:text-pm-mint"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
