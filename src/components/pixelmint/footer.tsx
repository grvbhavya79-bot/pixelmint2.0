import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "./brand-mark";

const NAV = [
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

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/[0.07]">
      <div className="mx-auto w-full max-w-7xl px-6 pt-16 lg:px-10">
        <div className="flex flex-col gap-12 pb-16 md:flex-row md:items-start md:justify-between">
          <div>
            <a href="#top" className="pm-focus group inline-flex items-center gap-2.5" aria-label="Pixelmint.fun — back to top">
              <BrandMark className="h-9 w-9 transition-transform duration-500 group-hover:rotate-90" />
              <span className="font-display text-xl font-bold tracking-tight text-pm-paper">
                pixelmint<span className="text-pm-mint">.fun</span>
              </span>
            </a>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-pm-mute">
              Mint ideas. Ship pixels.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pm-mute/60">
              Menu
            </p>
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="pm-focus w-fit text-sm text-pm-mute transition-colors hover:text-pm-mint"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pm-mute/60">
              Elsewhere
            </p>
            {SOCIALS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="pm-focus group inline-flex w-fit items-center gap-1.5 text-sm text-pm-mute transition-colors hover:text-pm-mint"
              >
                {item.label}
                <ArrowUpRight
                  size={13}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pm-mute/60">
              Say hello
            </p>
            <a
              href="mailto:hello@pixelmint.fun"
              className="pm-focus text-sm text-pm-mute transition-colors hover:text-pm-mint"
            >
              hello@pixelmint.fun
            </a>
          </div>
        </div>
      </div>

      {/* Oversized watermark */}
      <div className="overflow-hidden" aria-hidden="true">
        <p className="pm-outline -mb-[0.23em] select-none text-center font-display text-[clamp(4rem,14.5vw,15rem)] font-bold leading-none tracking-[-0.02em] opacity-40">
          PIXELMINT
        </p>
      </div>

      <div className="border-t border-white/[0.07]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 font-mono text-[11px] text-pm-mute/70 sm:flex-row lg:px-10">
          <p>© 2026 Pixelmint.fun. Built for the internet.</p>
          <p className="flex items-center gap-2.5">
            <span className="h-1 w-1 rotate-45 bg-pm-mint" aria-hidden="true" />
            Pixel-perfect, never personality-free
          </p>
        </div>
      </div>
    </footer>
  );
}
