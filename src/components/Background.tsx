"use client";

/* Backdrop: a deep stage with a single soft key-light, a precise fading grid,
   and real film grain. Restrained on purpose — no rainbow gradient soup. */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void">
      {/* single key light from top, brand violet */}
      <div
        className="absolute left-1/2 top-[-30%] h-[80vmax] w-[80vmax] -translate-x-1/2 rounded-full opacity-40 blur-[130px]"
        style={{ background: "radial-gradient(circle, rgba(124,92,255,0.5), transparent 62%)" }}
      />
      {/* faint cool fill from the lower right so it isn't flat */}
      <div
        className="absolute bottom-[-25%] right-[-15%] h-[55vmax] w-[55vmax] rounded-full opacity-20 blur-[130px]"
        style={{ background: "radial-gradient(circle, rgba(34,211,197,0.4), transparent 65%)" }}
      />

      {/* precise grid, masked to fade out */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black, transparent 72%)",
        }}
      />

      {/* film grain */}
      <div className="grain absolute inset-0" />

      {/* vignette to seat everything */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 25%, transparent 45%, rgba(2,2,5,0.9) 100%)" }}
      />
    </div>
  );
}
