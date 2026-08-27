import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./reveal";
import { PixelCube } from "./pixel-cube";

export function FinalCta() {
  return (
    <section
      id="contact"
      aria-labelledby="pm-cta-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.07] py-28 md:py-44"
    >
      {/* Glow backdrop */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute bottom-[-12rem] left-1/2 h-[30rem] w-[50rem] -translate-x-1/2 rounded-full bg-[#67F5B4]/[0.09] blur-[140px]" />
      </div>

      <div
        className="absolute left-[12%] top-[18%] hidden opacity-70 md:block"
        aria-hidden="true"
      >
        <PixelCube size={52} spinDuration={15} delay={0.8} acid />
      </div>
      <div
        className="absolute right-[10%] top-[30%] hidden opacity-70 lg:block"
        aria-hidden="true"
      >
        <PixelCube size={38} spinDuration={12} delay={1.6} />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-6 text-center">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-pm-mute">
            Open slot — Q4 2026
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            id="pm-cta-heading"
            className="mt-6 font-display text-[clamp(2.8rem,8vw,6.5rem)] font-bold leading-[0.98] tracking-[-0.03em] text-pm-paper"
          >
            Got a wild idea?
          </h2>
          <p className="pm-glow-mint mt-2 font-display text-[clamp(1.6rem,4vw,3.2rem)] font-bold leading-tight tracking-[-0.02em] text-pm-mint">
            Let’s mint it into something real.
          </p>
        </Reveal>

        <Reveal delay={0.22} className="mt-12">
          <a
            href="mailto:hello@pixelmint.fun"
            className="pm-btn-mint pm-focus px-8 py-4 text-base md:text-lg"
          >
            Hello@pixelmint.fun
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </Reveal>

        <Reveal delay={0.32}>
          <p className="mt-7 font-mono text-xs leading-relaxed text-pm-mute/80">
            Currently booking new projects — average reply within 24 hours.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
