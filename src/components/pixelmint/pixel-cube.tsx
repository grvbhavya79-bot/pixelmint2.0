import { cn } from "@/lib/utils";

type PixelCubeProps = {
  /** Edge length in px */
  size?: number;
  className?: string;
  /** Delay (seconds) before the float animation starts — use for stagger */
  delay?: number;
  /** Duration of one full spin in seconds */
  spinDuration?: number;
  acid?: boolean;
};

/**
 * Floating 3D pixel cube built with pure CSS 3D transforms.
 * Decorative only — always rendered aria-hidden by the parent.
 */
export function PixelCube({
  size = 96,
  className,
  delay = 0,
  spinDuration = 18,
  acid = false,
}: PixelCubeProps) {
  const half = size / 2;
  const face = acid ? "pm-face pm-face--acid" : "pm-face";

  return (
    <div
      className={cn("pm-cube-wrap", className)}
      style={{ width: size, height: size, animationDelay: `${delay}s` }}
      aria-hidden="true"
    >
      <div className="pm-scene" style={{ width: size, height: size }}>
        <div
          className="pm-cube"
          style={{ animationDuration: `${spinDuration}s` }}
        >
          <div className={face} style={{ transform: `translateZ(${half}px)` }} />
          <div
            className={face}
            style={{
              transform: `rotateY(180deg) translateZ(${half}px)`,
            }}
          />
          <div
            className={face}
            style={{ transform: `rotateY(90deg) translateZ(${half}px)` }}
          />
          <div
            className={face}
            style={{
              transform: `rotateY(-90deg) translateZ(${half}px)`,
            }}
          />
          <div
            className={face}
            style={{
              transform: `rotateX(90deg) translateZ(${half}px)`,
            }}
          />
          <div
            className={face}
            style={{
              transform: `rotateX(-90deg) translateZ(${half}px)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
