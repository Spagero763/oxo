"use client";

import { motion } from "framer-motion";

/* Hand-drawn-feeling X and O, stroked on with a path-draw animation and a soft
   glow that matches the player's accent colour. */

const stroke = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: i * 0.08, duration: 0.32, ease: [0.65, 0, 0.35, 1] as const },
      opacity: { delay: i * 0.08, duration: 0.05 },
    },
  }),
};

export function Mark({ kind, size = "70%" }: { kind: "X" | "O"; size?: string }) {
  const color = kind === "X" ? "#a892ff" : "#5eead4";
  const glow = kind === "X" ? "rgba(124,92,255,0.55)" : "rgba(34,211,197,0.5)";

  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      initial={{ scale: 0.6 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      style={{ filter: `drop-shadow(0 0 10px ${glow})` }}
    >
      {kind === "X" ? (
        <g stroke={color} strokeWidth={11} strokeLinecap="round" fill="none">
          <motion.line x1={26} y1={26} x2={74} y2={74} variants={stroke} custom={0} initial="hidden" animate="show" />
          <motion.line x1={74} y1={26} x2={26} y2={74} variants={stroke} custom={1} initial="hidden" animate="show" />
        </g>
      ) : (
        <motion.circle
          cx={50}
          cy={50}
          r={26}
          stroke={color}
          strokeWidth={11}
          strokeLinecap="round"
          fill="none"
          variants={stroke}
          custom={0}
          initial="hidden"
          animate="show"
        />
      )}
    </motion.svg>
  );
}

/** Small static glyph for labels and chips. */
export function MarkGlyph({ kind, className = "" }: { kind: "X" | "O"; className?: string }) {
  const color = kind === "X" ? "#a892ff" : "#5eead4";
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      {kind === "X" ? (
        <g stroke={color} strokeWidth={12} strokeLinecap="round">
          <line x1={28} y1={28} x2={72} y2={72} />
          <line x1={72} y1={28} x2={28} y2={72} />
        </g>
      ) : (
        <circle cx={50} cy={50} r={24} stroke={color} strokeWidth={12} />
      )}
    </svg>
  );
}
