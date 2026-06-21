"use client";

import PixelBlast from "@/components/ui/PixelBlast";

/**
 * Fixed full-viewport PixelBlast layer that persists across all route changes.
 * Rendered inside the root layout so the animation never restarts on navigation.
 */
export function PixelBlastBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <PixelBlast
        variant="square"
        pixelSize={4}
        color="#2c277d"
        patternScale={3}
        patternDensity={2.0}
        enableRipples
        rippleSpeed={0.3}
        rippleThickness={0.13}
        rippleIntensityScale={1}
        speed={0.5}
        transparent={false}
        edgeFade={0}
        colorIntensity={2.4}
      />
    </div>
  );
}
