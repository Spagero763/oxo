"use client";

import { motion } from "framer-motion";
import { Trophy, ChevronRight, Wallet, Gamepad2, Coins } from "lucide-react";
import { MODE_LIST } from "@/lib/modes";
import { useStore } from "@/lib/store";
import { signed } from "@/lib/format";
import { play } from "@/lib/sfx";
import { ONCHAIN_ENABLED } from "@/hooks/useOnchain";
import { useCeloBalance } from "@/hooks/useCeloBalance";
import { ModeCard } from "./ModeCard";
import { ShareButton } from "./ShareButton";
import { cn } from "@/lib/cn";
import type { Difficulty } from "@/lib/engine";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as const } }),
};

export function Home({
  onPlay,
  onLeaderboard,
}: {
  onPlay: (mode: Difficulty) => void;
  onLeaderboard: () => void;
}) {
  const { balance, stats } = useStore();
  const { balance: walletBalance } = useCeloBalance();
  const winRate = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;

  // when on-chain, affordability is enforced by the stake tx itself
  const affordable = (stake: number) => (ONCHAIN_ENABLED ? true : balance >= stake);

  return (
    <div className="flex w-full max-w-md flex-col">
      {/* hero */}
      <motion.div variants={fade} custom={0} initial="hidden" animate="show" className="mt-7">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.02] px-3 py-1 text-[11px] font-medium text-ink-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-bright shadow-[0_0_8px_#5eead4]" />
            Onchain noughts &amp; crosses · Celo
          </span>
          <ShareButton />
        </div>
        <h1 className="mt-5 font-display text-[3.4rem] font-bold leading-[0.95] tracking-tight text-ink">
          Outsmart
          <br />
          the <span className="text-violet-bright">machine.</span>
        </h1>
        <p className="mt-4 max-w-[19rem] text-[15px] leading-relaxed text-ink-dim">
          Stake a sliver of CELO each round. Beat the bot and take the pot. Draws hand your stake straight back.
        </p>
      </motion.div>

      {/* personal record */}
      <motion.div variants={fade} custom={1} initial="hidden" animate="show" className="mt-6 grid grid-cols-3 gap-2">
        {[
          { label: "Win rate", value: `${winRate}%`, c: "text-violet-bright" },
          { label: "Streak", value: stats.streak, c: "text-teal-bright" },
          { label: "Net CELO", value: signed(stats.net), c: stats.net >= 0 ? "text-gold" : "text-rose" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl glass px-3 py-3 text-center">
            <p className={cn("nums text-lg font-bold", s.c)}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-faint">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* mode cards */}
      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="mt-4 grid gap-3">
        {MODE_LIST.map((m) => (
          <ModeCard key={m.id} mode={m} affordable={affordable(m.stake)} onPlay={() => onPlay(m.id)} />
        ))}
      </motion.div>

      {/* how it works */}
      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="mt-5">
        <p className="mb-2 text-[11px] uppercase tracking-widest text-ink-faint">How it works</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Wallet, t: "Connect & fund", d: "Your Celo wallet" },
            { icon: Gamepad2, t: "Beat the bot", d: "You play X, first move" },
            { icon: Coins, t: "Take the pot", d: "Win pays up to 3×" },
          ].map((s, i) => (
            <div key={s.t} className="rounded-2xl border border-line bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/5 text-violet-bright">
                  <s.icon className="h-3.5 w-3.5" />
                </span>
                <span className="nums text-[11px] font-bold text-ink-faint">{i + 1}</span>
              </div>
              <p className="mt-2 text-xs font-semibold leading-tight text-ink">{s.t}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-ink-faint">{s.d}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* leaderboard */}
      <motion.button
        variants={fade}
        custom={4}
        initial="hidden"
        animate="show"
        onClick={() => { play("select"); onLeaderboard(); }}
        className="mt-4 flex items-center gap-3 rounded-3xl glass p-4 text-left transition-colors hover:bg-white/[0.05]"
      >
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold/15 text-gold">
          <Trophy className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">Leaderboard</p>
          <p className="text-xs text-ink-faint">Live, on-chain results</p>
        </div>
        <ChevronRight className="h-5 w-5 text-ink-faint" />
      </motion.button>

      <p className="mt-5 text-center text-[11px] text-ink-faint">
        {ONCHAIN_ENABLED
          ? walletBalance !== null
            ? "Stakes settle on Celo · draws refund your stake"
            : "Connect your wallet to stake and play"
          : "Demo mode · draws refund your stake"}
      </p>
    </div>
  );
}
