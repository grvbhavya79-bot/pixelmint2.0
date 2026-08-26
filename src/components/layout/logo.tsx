import { cn } from "@/lib/utils";

/**
 * ToolBox100 original brand mark.
 * A gradient rounded tile carrying a geometric "T" — the crossbar reads as a
 * shelf of tools, the cyan dot is the "100th tool" precision accent.
 * 100% original artwork (no third-party assets).
 */
export function LogoMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="ToolBox100 logo"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="tb100-bg" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="0.55" stopColor="#2563EB" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="tb100-shine" x1="24" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="tb100-dot" x1="32" y1="32" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#67E8F9" />
          <stop offset="1" stopColor="#2DD4BF" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#tb100-bg)" />
      <rect x="2" y="2" width="44" height="24" rx="12" fill="url(#tb100-shine)" />
      {/* T crossbar */}
      <rect x="12" y="12.5" width="24" height="5.5" rx="2.75" fill="#ffffff" />
      {/* T stem */}
      <rect x="21.25" y="12.5" width="5.5" height="24" rx="2.75" fill="#ffffff" />
      {/* precision dot */}
      <circle cx="36.5" cy="36.5" r="4" fill="url(#tb100-dot)" stroke="#1E40AF" strokeWidth="1.5" />
    </svg>
  );
}

export function Logo({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className="text-lg font-bold tracking-tight text-foreground">
        ToolBox<span className="text-primary">100</span>
      </span>
    </span>
  );
}
