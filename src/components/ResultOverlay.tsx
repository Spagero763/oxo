"use client";

import { motion } from "framer-motion";
import { RotateCcw, Home, Trophy, Loader2, ExternalLink } from "lucide-react";
import type { Outcome } from "@/lib/store";
import type { ModeConfig } from "@/lib/modes";
import { fmtCelo, signed } from "@/lib/format";
import { CELOSCAN } from "@/lib/contract";
import { cn } from "@/lib/cn";

const COPY: Record<Outcome, { title: string; sub: string; color: string }> = {
  win: { title: "You win", sub: "Outplayed the machine", color: "text-gold" },
  lose: { title: "Defeated", sub: "The machine held the line", color: "text-rose" },
  draw: { title: "Stalemate", sub: "Honours even — stake returned", color: "text-ink-dim" },
};

function Confetti() {
  const colors = ["#a892ff", "#5eead4", "#f6d66b", "#fb7185", "#ffffff"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 26 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const size = 6 + Math.random() * 8;
        return (
          <motion.span
            key={i}
            className="absolute top-[35%] rounded-[2px]"
            style={{ left: `${left}%`, width: size, height: size * 0.6, background: colors[i % colors.length] }}
            initial={{ y: 0, opacity: 1, rotate: 0 }}
            animate={{ y: 360, opacity: 0, rotate: 360 + Math.random() * 360 }}
            transition={{ duration: 1.4 + Math.random(), delay, ease: "easeIn" }}
          />
        );
      })}
    </div>
  );
}

export function ResultOverlay({
  outcome,
  mode,
  delta,
  balance,
  onRematch,
  onHome,
  onchain,
  settling,
  settleTx,
  settleErr,
}: {
  outcome: Outcome;
  mode: ModeConfig;
  delta: number;
  balance: number;
  onRematch: () => void;
  onHome: () => void;
  onchain?: boolean;
  settling?: boolean;
  settleTx?: string | null;
  settleErr?: string | null;
}) {
  const copy = COPY[outcome];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 grid place-items-center rounded-[28px] bg-void/80 backdrop-blur-md"
    >
      {outcome === "win" && <Confetti />}
      <motion.div
        initial={{ scale: 0.85, y: 14, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-[88%] max-w-[320px] rounded-3xl glass-strong p-6 text-center shadow-card"
      >
        <div className={cn("mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/5", copy.color)}>
          <Trophy className="h-6 w-6" />
        </div>
        <h2 className={cn("font-display text-3xl font-bold", copy.color)}>{copy.title}</h2>
        <p className="mt-1 text-sm text-ink-dim">{copy.sub}</p>

        <div className="mt-5 rounded-2xl bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-widest text-ink-faint">Stake settled</p>
          <p className={cn("nums mt-1 text-2xl font-bold", delta > 0 ? "text-gold" : delta < 0 ? "text-rose" : "text-ink")}>
            {signed(delta)} CELO
          </p>
          {onchain ? (
            <div className="mt-1 text-xs">
              {settling && (
                <span className="inline-flex items-center gap-1 text-ink-faint">
                  <Loader2 className="h-3 w-3 animate-spin" /> Settling on-chain…
                </span>
              )}
              {settleTx && (
                <a
                  href={`${CELOSCAN}/tx/${settleTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-teal-bright"
                >
                  Settled on-chain <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {settleErr && <span className="text-rose">{settleErr}</span>}
            </div>
          ) : (
            <p className="nums mt-1 text-xs text-ink-faint">Balance {fmtCelo(balance)} CELO</p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onHome}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl glass px-4 py-3 text-sm font-semibold text-ink-dim transition-colors hover:text-ink"
          >
            <Home className="h-4 w-4" /> Home
          </button>
          <button
            onClick={onRematch}
            className="relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold text-void"
            style={{ background: "linear-gradient(135deg, #a892ff, #5eead4)" }}
          >
            <RotateCcw className="h-4 w-4" /> Play again
          </button>
        </div>
        <p className="mt-3 text-[11px] text-ink-faint">{mode.name} mode · {fmtCelo(mode.stake)} CELO stake</p>
      </motion.div>
    </motion.div>
  );
}
