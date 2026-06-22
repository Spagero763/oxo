"use client";

/* Ambient backdrop: two slow-drifting aurora blobs, a fine grid, and a vignette.
   Pure CSS animation so it stays smooth and respects reduced-motion. */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void">
      {/* aurora */}
      <div className="aurora-a absolute -left-1/4 -top-1/3 h-[70vmax] w-[70vmax] rounded-full opacity-50 blur-[120px]"
           style={{ background: "radial-gradient(circle at 30% 30%, rgba(124,92,255,0.55), transparent 60%)" }} />
      <div className="aurora-b absolute -right-1/4 top-1/4 h-[60vmax] w-[60vmax] rounded-full opacity-40 blur-[120px]"
           style={{ background: "radial-gradient(circle at 70% 40%, rgba(34,211,197,0.45), transparent 60%)" }} />
      <div className="aurora-a absolute bottom-[-20%] left-1/3 h-[50vmax] w-[50vmax] rounded-full opacity-25 blur-[120px]"
           style={{ background: "radial-gradient(circle at 50% 50%, rgba(246,214,107,0.3), transparent 60%)" }} />

      {/* faint grid */}
      <div className="absolute inset-0 opacity-[0.04]"
           style={{
             backgroundImage:
               "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
             backgroundSize: "44px 44px",
             maskImage: "radial-gradient(circle at 50% 40%, black, transparent 75%)",
             WebkitMaskImage: "radial-gradient(circle at 50% 40%, black, transparent 75%)",
           }} />

      {/* vignette */}
      <div className="absolute inset-0"
           style={{ background: "radial-gradient(circle at 50% 30%, transparent 40%, rgba(3,3,6,0.85) 100%)" }} />
    </div>
  );
}
