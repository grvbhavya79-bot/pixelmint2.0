import { cn } from "@/lib/utils";

const ITEMS = [
  "Branding",
  "Web Design",
  "Development",
  "Motion",
  "Digital Products",
];

/** One seamless half of the marquee track (repeated 3× so it always covers ultrawide screens). */
function MarqueeHalf() {
  return (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {[...ITEMS, ...ITEMS, ...ITEMS].map((item, i) => (
        <span key={i} className="flex items-center">
          <span
            className={cn(
              "whitespace-nowrap font-display text-4xl font-bold uppercase tracking-tight md:text-6xl",
              i % 2 === 0 ? "text-pm-paper" : "pm-outline"
            )}
          >
            {item}
          </span>
          <span
            className="mx-8 h-2.5 w-2.5 shrink-0 rotate-45 bg-pm-mint md:mx-12"
            aria-hidden="true"
          />
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <section aria-label="What we do" className="relative border-y border-white/[0.07] bg-[#0B0E0D] py-7 md:py-9">
      <p className="sr-only">
        Branding, web design, development, motion, and digital products.
      </p>
      <div className="pm-marquee">
        <div className="pm-marquee-track">
          <MarqueeHalf />
          <MarqueeHalf />
        </div>
      </div>
    </section>
  );
}
