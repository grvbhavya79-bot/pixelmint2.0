"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { Reveal } from "./reveal";
import { PixelCube } from "./pixel-cube";

const STATS = [
  { value: 48, suffix: "+", label: "Projects shipped" },
  { value: 12, suffix: "", label: "Countries reached" },
  { value: 6, suffix: " yrs", label: "Minting for the internet" },
  { value: 100, suffix: "%", label: "Personality retained" },
];

function Stat({ value, suffix, label, delay }: (typeof STATS)[number] & { delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.6,
      delay,
      ease: [0.21, 0.47, 0.32, 0.98],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, delay]);

  return (
    <div className="border-t border-white/10 pt-5">
      <span
        ref={ref}
        className="font-display text-4xl font-bold tracking-tight text-pm-paper md:text-5xl"
      >
        {display}
        <span className="text-pm-mint">{suffix}</span>
      </span>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-pm-mute">
        {label}
      </p>
    </div>
  );
}

export function About() {
  return (
    <section
      id="studio"
      aria-labelledby="pm-studio-heading"
      className="relative scroll-mt-24 overflow-x-clip border-t border-white/[0.07] py-24 md:py-36"
    >
      <div
        className="pointer-events-none absolute -left-32 top-1/3 h-[22rem] w-[22rem] rounded-full bg-[#67F5B4]/[0.05] blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:gap-20 lg:px-10">
        <Reveal>
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-pm-mint">
            <span className="h-1.5 w-1.5 bg-pm-mint" aria-hidden="true" />
            The studio
          </p>
          <h2
            id="pm-studio-heading"
            className="mt-5 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.02em] text-pm-paper"
          >
            Small pixels.
            <br />
            <span className="text-pm-mint">Big presence.</span>
          </h2>
          <p className="mt-7 max-w-lg text-base leading-relaxed text-pm-mute md:text-lg">
            We combine strategy, design, and code to make brands impossible to
            ignore. Pixelmint.fun is a compact crew of designers, engineers,
            and internet obsessives — no account managers, no hand-offs. The
            people you meet are the people who ship.
          </p>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-pm-mute">
            We move fast, sweat the last five percent, and treat every launch
            like it’s our own. Made to be noticed — that’s the whole brief.
          </p>
        </Reveal>

        <Reveal delay={0.12} className="pm-glass relative flex flex-col justify-between overflow-hidden rounded-3xl p-8 md:p-10">
          <div
            className="pointer-events-none absolute -right-10 -top-10 opacity-80"
            aria-hidden="true"
          >
            <PixelCube size={84} spinDuration={20} />
          </div>
          <blockquote className="max-w-sm">
            <span
              className="font-display text-6xl font-bold leading-none text-pm-mint"
              aria-hidden="true"
            >
              “
            </span>
            <p className="-mt-3 font-display text-xl font-medium leading-snug text-pm-paper md:text-2xl">
              The internet is the biggest gallery on earth. We just hang your
              work where everyone can see it.
            </p>
          </blockquote>
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8">
            {STATS.map((stat, i) => (
              <Stat key={stat.label} {...stat} delay={i * 0.1} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
