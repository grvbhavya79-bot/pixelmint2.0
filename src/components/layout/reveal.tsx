"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  /** Extra classes for the wrapper (layout, grid, etc.). */
  className?: string;
  /** Stagger delay in ms — applies as transitionDelay once visible. */
  delay?: number;
  /** Reveal only once (default) or re-hide when scrolled away. */
  once?: boolean;
  /** Reveal direct children sequentially instead of the wrapper itself. */
  stagger?: boolean;
  /** Semantic wrapper element (default "div"). */
  as?: "div" | "ol" | "ul" | "section" | "li";
};

/**
 * Scroll-reveal wrapper. Adds the hidden-state class (`.pm-reveal`, or
 * `.pm-stagger` for sequential children — both only active when JS is
 * available, see the `html.js` gate in globals.css) and toggles
 * `.is-visible` when the element enters the viewport.
 *
 * Graceful degradation: users with reduced motion or without
 * IntersectionObserver see content instantly.
 */
export function Reveal({
  children,
  className,
  delay,
  once = true,
  stagger = false,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- instant display for reduced-motion / no-IO users
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.some((entry) => entry.isIntersecting);
        if (intersecting) setVisible(true);
        else if (!once) setVisible(false);
        if (intersecting && once) io.disconnect();
      },
      // Trigger slightly before the element fully enters the viewport so the
      // animation is already running when it becomes visible.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  const Tag = as as ElementType;
  return (
    <Tag
      ref={ref}
      className={cn(stagger ? "pm-stagger" : "pm-reveal", visible && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
