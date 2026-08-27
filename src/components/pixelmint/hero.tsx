"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ParticleField } from "./particle-field";
import { PixelCube } from "./pixel-cube";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

export function Hero() {
  const reduce = useReducedMotion();

  const enter = (delay: number) => ({
    initial: reduce
      ? { opacity: 0 }
      : { opacity: 0, y: 34, filter: "blur(8px)" },
    animate: reduce
      ? { opacity: 1 }
      : { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, delay, ease: EASE },
  });

  return (
    <section
      id="top"
      aria-label="Pixelmint — creative digital studio"
      className="relative flex min-h-svh flex-col overflow-hidden"
    >
      {/* Backdrop: glows + faint grid */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 h-[34rem] w-[54rem] -translate-x-1/2 rounded-full bg-[#67F5B4]/[0.07] blur-[130px]" />
        <div className="absolute -right-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-[#D6FF4B]/[0.05] blur-[120px]" />
        <div className="absolute -left-48 top-1/3 h-[22rem] w-[22rem] rounded-full bg-[#67F5B4]/[0.05] blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(255 255 255 / 0.025) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.025) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 75%)",
          }}
        />
      </div>

      {/* Animated mint pixel particles */}
      <div className="absolute inset-0" aria-hidden="true">
        <ParticleField />
      </div>

      {/* Floating 3D pixel cubes */}
      <div
        className="absolute right-[7%] top-[20%] hidden lg:block"
        aria-hidden="true"
      >
        <PixelCube size={116} spinDuration={22} />
      </div>
      <div
        className="absolute bottom-[26%] left-[5%] hidden lg:block"
        aria-hidden="true"
      >
        <PixelCube size={62} delay={1.3} spinDuration={16} acid />
      </div>
      <div
        className="absolute bottom-[15%] right-[23%] hidden xl:block"
        aria-hidden="true"
      >
        <PixelCube size={38} delay={2.4} spinDuration={13} />
      </div>

      {/* Copy */}
      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 pb-16 pt-36 text-center lg:px-10">
        <motion.p
          {...enter(0.05)}
          className="pm-glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-pm-mute"
        >
          <span className="pm-live-dot" aria-hidden="true" />
          Freshly minted — creative studio
        </motion.p>

        <motion.h1
          {...enter(0.15)}
          className="mt-8 font-display text-[clamp(3.2rem,10vw,8.5rem)] font-bold leading-[0.94] tracking-[-0.03em] text-pm-paper"
        >
          <span className="block">Mint ideas.</span>
          <span className="pm-glow-mint block text-pm-mint">Ship pixels.</span>
        </motion.h1>

        <motion.p
          {...enter(0.3)}
          className="mt-7 max-w-xl text-balance text-base leading-relaxed text-pm-mute sm:text-lg"
        >
          Pixelmint.fun is a creative digital studio for brands that refuse to
          blend in.
        </motion.p>

        <motion.div
          {...enter(0.42)}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <a href="#contact" className="pm-btn-mint pm-focus px-7 py-3.5 text-base">
            Start a project
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
          <a href="#work" className="pm-btn-ghost pm-focus px-7 py-3.5 text-base">
            Explore our work
          </a>
        </motion.div>
      </div>

      {/* Bottom strip */}
      <motion.div
        {...enter(0.65)}
        className="relative mx-auto flex w-full max-w-7xl items-end justify-between px-6 pb-9 font-mono text-[11px] uppercase tracking-[0.18em] text-pm-mute/70 lg:px-10"
      >
        <span className="hidden sm:block">Internet-native by design</span>
        <span className="flex flex-col items-center gap-3">
          <span className="sr-only">Scroll to explore</span>
          <span className="pm-scroll-line" aria-hidden="true" />
        </span>
        <span className="hidden sm:block">EST. 2026 — Worldwide</span>
      </motion.div>
    </section>
  );
}
