import { cn } from "@/lib/utils";

/**
 * Pixelmint brand mark — a 2×2 cluster of mint pixels with one acid pixel.
 * The square cluster reads as an isometric cube at small sizes.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="9" fill="#0D1211" />
      <rect x="9" y="9" width="10" height="10" fill="#67F5B4" />
      <rect x="21" y="9" width="10" height="10" fill="#67F5B4" opacity="0.5" />
      <rect x="9" y="21" width="10" height="10" fill="#67F5B4" opacity="0.5" />
      <rect x="21" y="21" width="10" height="10" fill="#D6FF4B" />
    </svg>
  );
}
