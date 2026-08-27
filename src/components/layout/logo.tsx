import { cn } from "@/lib/utils";

/**
 * Pixelmint.fun brand mark.
 * A 5×5 pixel grid whose lit squares assemble into a bold "P",
 * with one mint sparkle pixel. Squares animate in on mount
 * (CSS-only, staggered); the sparkle gently pulses. Reduced-motion
 * users see the final assembled mark instantly.
 * 100% original artwork.
 */

// (col, row, tone) of the lit pixels that draw the "P"
const P_PIXELS: Array<[number, number, 1 | 2]> = [
  [0, 0, 1], [1, 0, 1], [2, 0, 1], [3, 0, 1],
  [0, 1, 1], [3, 1, 2],
  [0, 2, 1], [1, 2, 1], [2, 2, 1],
  [0, 3, 1],
  [0, 4, 1],
];

export function LogoMark({
  className,
  size = 36,
  animate = true,
}: {
  className?: string;
  size?: number;
  animate?: boolean;
}) {
  const cell = 6.8;
  const gap = 1.2;
  const origin = 4.2;
  const pos = (i: number) => origin + i * (cell + gap);
  // sparkle sits just outside the grid, top-right
  const sparkSize = 5.4;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Pixelmint.fun logo"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="pm-mint-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#40E6B1" />
          <stop offset="1" stopColor="#0FAE7E" />
        </linearGradient>
      </defs>
      <g className="pm-logo-group">
        {P_PIXELS.map(([c, r, tone], i) => (
          <rect
            key={`${c}-${r}`}
            x={pos(c)}
            y={pos(r)}
            width={cell}
            height={cell}
            rx={1.6}
            fill="url(#pm-mint-grad)"
            opacity={tone === 2 ? 0.55 : 1}
            className={animate ? "pm-pixel" : undefined}
            style={animate ? { animationDelay: `${i * 45}ms` } : undefined}
          />
        ))}
        <rect
          x={pos(4) + 1.4}
          y={pos(0) - 2.1}
          width={sparkSize}
          height={sparkSize}
          rx={1.3}
          fill="#40E6B1"
          className={animate ? "pm-sparkle" : undefined}
        />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  size = 36,
  animate = true,
}: {
  className?: string;
  size?: number;
  animate?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} animate={animate} />
      <span className="font-display text-lg font-bold tracking-tight text-foreground">
        Pixelmint<span className="text-primary">.fun</span>
      </span>
    </span>
  );
}
