"use client";

import { motion } from "framer-motion";
import { Trophy, ChevronRight, RefreshCw } from "lucide-react";
import { MODE_LIST } from "@/lib/modes";
import { leaderboard, resetBalance, useStore } from "@/lib/store";
import { fmtCelo, signed } from "@/lib/format";
import { play } from "@/lib/sfx";
import { ModeCard } from "./ModeCard";
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
  const top = leaderboard().slice(0, 3);
  const winRate = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
  const lowBalance = balance < MODE_LIST[0].stake;

  return (
    <div className="flex w-full max-w-md flex-col">
      {/* hero */}
      <motion.div variants={fade} custom={0} initial="hidden" animate="show" className="mt-7">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.02] px-3 py-1 text-[11px] font-medium text-ink-dim">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-bright shadow-[0_0_8px_#5eead4]" />
          Onchain noughts &amp; crosses · Celo
        </span>
        <h1 className="mt-5 font-display text-[3.4rem] font-bold leading-[0.95] tracking-tight text-ink">
          Outsmart
          <br />
          the <span className="text-violet-bright">machine.</span>
        </h1>
        <p className="mt-4 max-w-[19rem] text-[15px] leading-relaxed text-ink-dim">
          Stake a sliver of CELO each round. Beat the bot and take the pot. Draws hand your stake straight back.
        </p>
      </motion.div>

      {/* stats strip */}
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
          <ModeCard key={m.id} mode={m} affordable={balance >= m.stake} onPlay={() => onPlay(m.id)} />
        ))}
      </motion.div>

      {lowBalance && (
        <button
          onClick={() => {
            play("coin");
            resetBalance();
          }}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl glass py-3 text-sm font-semibold text-teal-bright"
        >
          <RefreshCw className="h-4 w-4" /> Top up demo balance
        </button>
      )}

      {/* leaderboard preview */}
      <motion.button
        variants={fade}
        custom={3}
        initial="hidden"
        animate="show"
        onClick={onLeaderboard}
        className="mt-4 flex items-center gap-3 rounded-3xl glass p-4 text-left transition-colors hover:bg-white/[0.05]"
      >
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold/15 text-gold">
          <Trophy className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">Leaderboard</p>
          <p className="text-xs text-ink-faint">
            {top.map((t, i) => (
              <span key={t.id}>
                {i > 0 && " · "}
                <span className={t.you ? "text-violet-bright" : ""}>{t.name.split(".")[0]}</span>
              </span>
            ))}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-ink-faint" />
      </motion.button>

      <p className="mt-5 text-center text-[11px] text-ink-faint">
        Balance {fmtCelo(balance)} CELO · draws refund your stake
      </p>
    </div>
  );
}
