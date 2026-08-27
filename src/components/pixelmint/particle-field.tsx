"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ParticleFieldProps = {
  className?: string;
};

type Particle = {
  x: number;
  y: number;
  size: number;
  vy: number;
  sway: number;
  phase: number;
  speed: number;
  baseAlpha: number;
  acid: boolean;
};

/**
 * Animated field of mint "pixel" particles drifting upward with a gentle
 * twinkle. Canvas-based, DPR-capped, pauses when the tab is hidden and
 * renders a single static frame when the user prefers reduced motion.
 */
export function ParticleField({ className }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let raf = 0;
    let particles: Particle[] = [];
    let running = true;

    const MINT = "103, 245, 180";
    const ACID = "214, 255, 75";

    const spawn = (initial: boolean): Particle => ({
      x: Math.random() * width,
      y: initial ? Math.random() * height : height + 8,
      size: 1.5 + Math.random() * 3,
      vy: 0.08 + Math.random() * 0.28,
      sway: 0.4 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.4,
      baseAlpha: 0.25 + Math.random() * 0.55,
      acid: Math.random() < 0.16,
    });

    const targetCount = () =>
      Math.max(28, Math.min(88, Math.floor((width * height) / 24000)));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = targetCount();
      if (particles.length > count) particles.length = count;
      while (particles.length < count) particles.push(spawn(true));
    };

    const drawFrame = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.001 * p.speed + p.phase);
        const alpha = p.baseAlpha * twinkle;
        const drift = Math.sin(t * 0.0006 * p.speed + p.phase) * p.sway;
        ctx.fillStyle = `rgba(${p.acid ? ACID : MINT}, ${alpha.toFixed(3)})`;
        ctx.fillRect(
          Math.round(p.x + drift),
          Math.round(p.y),
          p.size,
          p.size
        );
      }
    };

    const step = (t: number) => {
      if (!running) return;
      for (const p of particles) {
        p.y -= p.vy;
        if (p.y < -10) {
          Object.assign(p, spawn(false));
        }
      }
      drawFrame(t);
      raf = requestAnimationFrame(step);
    };

    resize();

    if (reduced) {
      // Static scatter — no motion, still sets the mood.
      drawFrame(1200);
    } else {
      raf = requestAnimationFrame(step);
    }

    const onVisibility = () => {
      if (reduced) return;
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else {
        running = true;
        raf = requestAnimationFrame(step);
      }
    };

    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) drawFrame(1200);
    });
    observer.observe(canvas);

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none h-full w-full", className)}
      aria-hidden="true"
    />
  );
}
