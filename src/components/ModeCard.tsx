"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, Flame } from "lucide-react";
import type { ModeConfig } from "@/lib/modes";
import { fmtCelo } from "@/lib/format";
import { cn } from "@/lib/cn";

export function ModeCard({
  mode,
  affordable,
  onPlay,
}: {
  mode: ModeConfig;
  affordable: boolean;
  onPlay: () => void;
}) {
  const violet = mode.accent === "violet";
  const accent = violet ? "#a892ff" : "#5eead4";
  const Icon = violet ? Zap : Flame;

  return (
    <motion.button
      onClick={onPlay}
      disabled={!affordable}
      whileHover={affordable ? { y: -4 } : undefined}
      whileTap={affordable ? { scale: 0.985 } : undefined}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-3xl glass p-5 text-left shadow-card transition-opacity",
        !affordable && "opacity-50"
      )}
    >
      {/* accent wash */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-50"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 65%)` }}
      />

      <div className="flex items-center justify-between">
        <span
          className="grid h-11 w-11 place-items-center rounded-2xl"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: `${accent}1a`, color: accent }}
        >
          {mode.blunderHint}
        </span>
      </div>

      <h3 className="mt-4 font-display text-2xl font-bold text-ink">{mode.name}</h3>
      <p className="mt-1 text-sm leading-snug text-ink-dim">{mode.blurb}</p>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-ink-faint">Stake</p>
          <p className="nums text-sm font-semibold text-ink">{fmtCelo(mode.stake)} CELO</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-ink-faint">Win pays</p>
          <p className="nums text-sm font-semibold" style={{ color: accent }}>
            {mode.payout}× · {fmtCelo(mode.stake * mode.payout)}
          </p>
        </div>
      </div>

      <div
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-void transition-transform"
        style={{
          background: affordable
            ? `linear-gradient(180deg, color-mix(in srgb, ${accent} 78%, #ffffff), ${accent})`
            : "#23232e",
          boxShadow: affordable ? `0 10px 26px -10px ${accent}` : "none",
          color: affordable ? "#0a0a11" : "#5e5e76",
        }}
      >
        {affordable ? (
          <>
            Stake &amp; Play <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        ) : (
          "Balance too low"
        )}
      </div>
    </motion.button>
  );
}
