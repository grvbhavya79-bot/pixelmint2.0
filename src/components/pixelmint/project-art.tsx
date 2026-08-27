import { cn } from "@/lib/utils";

/**
 * Generative, self-contained SVG artworks for the four case-study cards.
 * No raster assets — sharp at any size, instant to load.
 */

function ArtFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-[#0B0F0E] transition-transform duration-700 ease-out group-hover:scale-[1.05]",
        className
      )}
    >
      <svg
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden="true"
      >
        {children}
      </svg>
    </div>
  );
}

function FaintGrid({ id }: { id: string }) {
  return (
    <g opacity="0.5">
      <defs>
        <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(255 255 255 / 0.04)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill={`url(#${id})`} />
    </g>
  );
}

/** 01 — Hyperloop FM · Brand identity · broadcast signal + waveform */
export function HyperloopArt() {
  const bars = [34, 58, 22, 72, 44, 88, 30, 52, 66, 26, 80, 40, 60, 24, 48, 70, 36, 54, 20, 62];
  return (
    <ArtFrame>
      <FaintGrid id="pm-hf-grid" />
      <defs>
        <radialGradient id="pm-hf-glow" cx="24%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#67F5B4" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#67F5B4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#pm-hf-glow)" />
      {[70, 118, 166, 214, 262, 310].map((r, i) => (
        <circle
          key={r}
          cx="170"
          cy="300"
          r={r}
          fill="none"
          stroke="#67F5B4"
          strokeOpacity={0.5 - i * 0.07}
          strokeWidth="1.5"
        />
      ))}
      <rect x="166" y="296" width="8" height="8" fill="#67F5B4" />
      <text x="345" y="230" fontFamily="ui-monospace, monospace" fontSize="15" letterSpacing="5" fill="#A6B0A9">
        SIGNAL // 99.9 FM
      </text>
      <text x="342" y="290" fontFamily="sans-serif" fontWeight="bold" fontSize="52" fill="#EFF3EE">
        HYPERLOOP
      </text>
      {bars.map((h, i) => (
        <rect
          key={i}
          x={345 + i * 22}
          y={480 - h}
          width="10"
          height={h}
          fill={i % 5 === 0 ? "#D6FF4B" : "#67F5B4"}
          opacity="0.85"
        />
      ))}
      <rect x="345" y="492" width="440" height="1" fill="rgb(255 255 255 / 0.15)" />
    </ArtFrame>
  );
}

/** 02 — Nova Supply Co. · Web design · chromatic pixel type */
export function NovaArt() {
  const pixels: Array<[number, number, string, number]> = [
    [96, 96, "#67F5B4", 0.9], [96, 128, "#67F5B4", 0.35],
    [128, 96, "#67F5B4", 0.35], [640, 448, "#D6FF4B", 0.8],
    [672, 416, "#D6FF4B", 0.3], [640, 480, "#67F5B4", 0.25],
    [704, 128, "#67F5B4", 0.5], [96, 448, "#67F5B4", 0.4],
    [64, 416, "#D6FF4B", 0.35], [736, 96, "#D6FF4B", 0.4],
  ];
  return (
    <ArtFrame>
      <FaintGrid id="pm-ns-grid" />
      {pixels.map(([x, y, fill, opacity], i) => (
        <rect key={i} x={x} y={y} width="16" height="16" fill={fill} opacity={opacity} />
      ))}
      <text x="394" y="318" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="150" fill="#D6FF4B" opacity="0.4">
        NOVA
      </text>
      <text x="406" y="318" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="150" fill="#67F5B4" opacity="0.75">
        NOVA
      </text>
      <text x="400" y="318" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="150" fill="#EFF3EE">
        NOVA
      </text>
      <text x="400" y="392" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="15" letterSpacing="5" fill="#A6B0A9">
        SUPPLY CO. — DROP 004
      </text>
    </ArtFrame>
  );
}

/** 03 — Loopworm · Digital product · living loop path */
export function LoopwormArt() {
  return (
    <ArtFrame>
      <FaintGrid id="pm-lw-grid" />
      <defs>
        <radialGradient id="pm-lw-glow" cx="72%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#67F5B4" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#67F5B4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#pm-lw-glow)" />
      <g className="pm-art-dash">
        <path
          d="M90,450 C210,170 330,560 460,330 C540,185 640,150 730,250 C775,305 705,375 630,340 C555,305 595,205 690,168"
          fill="none"
          stroke="#67F5B4"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      {([[90, 450], [460, 330], [730, 250], [630, 340]] as Array<[number, number]>).map(
        ([x, y], i) => (
          <rect
            key={i}
            x={x - 5}
            y={y - 5}
            width="10"
            height="10"
            fill={i === 2 ? "#D6FF4B" : "#67F5B4"}
          />
        )
      )}
      <text x="90" y="520" fontFamily="ui-monospace, monospace" fontSize="15" letterSpacing="5" fill="#A6B0A9">
        LOOP × ∞ — STREAK ENGINE
      </text>
    </ArtFrame>
  );
}

/** 04 — Moonbloom · Motion & launch · glowing satellite */
export function MoonbloomArt() {
  const stars: Array<[number, number, number]> = [
    [110, 90, 3], [180, 150, 2], [90, 210, 2], [240, 80, 2],
    [150, 300, 3], [60, 380, 2], [230, 220, 3], [300, 120, 2],
    [380, 60, 2], [340, 180, 3],
  ];
  return (
    <ArtFrame>
      <FaintGrid id="pm-mb-grid" />
      <defs>
        <radialGradient id="pm-mb-moon" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#1A211E" />
          <stop offset="100%" stopColor="#0E1211" />
        </radialGradient>
        <radialGradient id="pm-mb-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#67F5B4" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#67F5B4" stopOpacity="0" />
        </radialGradient>
      </defs>
      {stars.map(([x, y, s], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={s}
          height={s}
          fill={i % 3 === 0 ? "#67F5B4" : "#EFF3EE"}
          opacity="0.7"
        />
      ))}
      <circle cx="500" cy="270" r="235" fill="url(#pm-mb-glow)" />
      <circle cx="500" cy="270" r="150" fill="url(#pm-mb-moon)" stroke="#67F5B4" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="548" cy="228" r="128" fill="#0B0F0E" />
      <ellipse
        cx="500"
        cy="270"
        rx="290"
        ry="86"
        fill="none"
        stroke="rgb(255 255 255 / 0.14)"
        strokeWidth="1"
        transform="rotate(-16 500 270)"
      />
      <rect x="708" y="140" width="9" height="9" fill="#D6FF4B" />
      <text x="110" y="510" fontFamily="ui-monospace, monospace" fontSize="15" letterSpacing="5" fill="#A6B0A9">
        MOONBLOOM — LAUNCH FILM
      </text>
    </ArtFrame>
  );
}
