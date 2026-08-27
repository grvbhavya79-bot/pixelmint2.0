import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./reveal";
import {
  HyperloopArt,
  LoopwormArt,
  MoonbloomArt,
  NovaArt,
} from "./project-art";
import { cn } from "@/lib/utils";

const PROJECTS = [
  {
    index: "01",
    title: "Hyperloop FM",
    category: "Brand Identity",
    year: "2026",
    blurb: "A sonic identity system for an internet-native radio station.",
    Art: HyperloopArt,
  },
  {
    index: "02",
    title: "Nova Supply Co.",
    category: "Web Design",
    year: "2025",
    blurb: "A drop-culture storefront that sells out in minutes, not days.",
    Art: NovaArt,
  },
  {
    index: "03",
    title: "Loopworm",
    category: "Digital Product",
    year: "2025",
    blurb: "A habit tracker that feels less like homework, more like a game.",
    Art: LoopwormArt,
  },
  {
    index: "04",
    title: "Moonbloom",
    category: "Motion & Launch",
    year: "2026",
    blurb: "A launch film and campaign for sleep tech worth staying up for.",
    Art: MoonbloomArt,
  },
];

export function Work() {
  return (
    <section id="work" aria-labelledby="pm-work-heading" className="relative scroll-mt-24 overflow-x-clip py-24 md:py-36">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[22rem] w-[46rem] -translate-x-1/2 rounded-full bg-[#67F5B4]/[0.04] blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-pm-mint">
              <span className="h-1.5 w-1.5 bg-pm-mint" aria-hidden="true" />
              Selected work
            </p>
            <h2
              id="pm-work-heading"
              className="mt-5 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.02em] text-pm-paper"
            >
              Made to be <span className="text-pm-mint">noticed.</span>
            </h2>
          </div>
          <p className="max-w-xs font-mono text-xs leading-relaxed text-pm-mute/80">
            A few favourites from the vault — 2025 / 2026. Hover to feel them
            move.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-x-6 gap-y-14 md:mt-20 md:grid-cols-2">
          {PROJECTS.map((project, i) => (
            <Reveal
              key={project.index}
              as="article"
              delay={0.05 * (i % 2)}
              className={cn(i % 2 === 1 && "md:translate-y-16")}
            >
              <div className="group relative">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0F0E] transition-colors duration-500 group-hover:border-pm-mint/30">
                  <project.Art />
                  {/* readability veil */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#080A0A]/55 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-40"
                    aria-hidden="true"
                  />
                  <span className="pm-glass absolute left-4 top-4 rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-pm-paper">
                    {project.category}
                  </span>
                  <span className="absolute right-4 top-4 font-mono text-[11px] text-pm-mute">
                    {project.year}
                  </span>
                  <span
                    className="absolute bottom-4 right-4 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-pm-mint text-[#080A0A] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                    aria-hidden="true"
                  >
                    <ArrowUpRight size={18} />
                  </span>
                </div>

                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl font-bold tracking-tight text-pm-paper transition-colors duration-300 group-hover:text-pm-mint md:text-3xl">
                      {project.title}
                    </h3>
                    <p className="mt-1.5 max-w-md text-sm leading-relaxed text-pm-mute">
                      {project.blurb}
                    </p>
                  </div>
                  <span
                    className="pm-outline-mint select-none font-display text-4xl font-bold leading-none md:text-5xl"
                    aria-hidden="true"
                  >
                    {project.index}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
