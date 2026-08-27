import { Reveal } from "./reveal";

const TESTIMONIALS = [
  {
    quote:
      "Pixelmint took a napkin sketch and returned a brand people screenshot and share. Still our best-performing launch, a year later.",
    name: "Maya Chen",
    role: "Founder — Loopworm",
  },
  {
    quote:
      "The site shipped in weeks, loaded instantly, and tripled our signups within the first month. It simply feels alive.",
    name: "Daniel Okafor",
    role: "CEO — Moonbloom",
  },
  {
    quote:
      "Working with them felt like a heist movie where everything goes right. Zero ego, all craft.",
    name: "Sasha Lane",
    role: "CMO — Hyperloop FM",
  },
];

export function Testimonials() {
  return (
    <section
      aria-labelledby="pm-testimonials-heading"
      className="relative overflow-x-clip border-t border-white/[0.07] py-24 md:py-36"
    >
      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-pm-mint">
            <span className="h-1.5 w-1.5 bg-pm-mint" aria-hidden="true" />
            Word on the internet
          </p>
          <h2
            id="pm-testimonials-heading"
            className="mt-5 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.02em] text-pm-paper"
          >
            Signal, not noise.
          </h2>
        </Reveal>

        <ul className="mt-14 grid gap-10 md:mt-20 lg:grid-cols-3 lg:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <Reveal
              key={t.name}
              as="li"
              delay={0.08 * i}
              className={
                i === 1
                  ? "flex flex-col border-t border-white/10 pt-8 lg:translate-y-10"
                  : "flex flex-col border-t border-white/10 pt-8"
              }
            >
              <span
                className="font-display text-5xl font-bold leading-none text-pm-mint"
                aria-hidden="true"
              >
                “
              </span>
              <blockquote className="mt-2 flex-1">
                <p className="font-display text-lg font-medium leading-relaxed text-pm-paper/90 md:text-xl">
                  {t.quote}
                </p>
              </blockquote>
              <footer className="mt-7 flex items-center gap-3">
                <span
                  className="h-2 w-2 rotate-45 bg-pm-mint"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-pm-paper">{t.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-pm-mute">
                    {t.role}
                  </p>
                </div>
              </footer>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
