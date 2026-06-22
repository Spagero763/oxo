"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Crown } from "lucide-react";
import { leaderboard, useStore } from "@/lib/store";
import { fmtCelo, signed } from "@/lib/format";
import { cn } from "@/lib/cn";

export function LeaderboardView({ onHome }: { onHome: () => void }) {
  useStore(); // re-render when stats change
  const rows = leaderboard();
  const me = rows.find((r) => r.you);
  const myRank = rows.findIndex((r) => r.you) + 1;

  return (
    <div className="flex w-full max-w-md flex-col">
      <div className="flex items-center justify-between">
        <button
          onClick={onHome}
          className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-sm text-ink-dim transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Lobby
        </button>
        <span className="rounded-full glass px-3 py-1.5 text-xs font-semibold text-gold">Leaderboard</span>
      </div>

      <h1 className="mt-5 font-display text-3xl font-bold text-gradient">Hall of fame</h1>
      <p className="mt-1 text-sm text-ink-dim">
        Ranked by net CELO. You sit at #{myRank} with {me?.wins ?? 0}W · {me?.losses ?? 0}L.
      </p>

      <div className="mt-5 flex flex-col gap-1.5">
        {rows.map((r, i) => {
          const rank = i + 1;
          const podium = rank <= 3;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.035, 0.4) }}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors",
                r.you ? "glass-strong ring-1 ring-violet/40" : "bg-white/[0.02]"
              )}
            >
              <span
                className={cn(
                  "nums grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold",
                  rank === 1 && "bg-gold/20 text-gold",
                  rank === 2 && "bg-white/10 text-ink",
                  rank === 3 && "bg-[#cd7f32]/20 text-[#e8a45c]",
                  rank > 3 && "bg-white/5 text-ink-faint"
                )}
              >
                {podium ? <Crown className="h-3.5 w-3.5" /> : rank}
              </span>
              <span className="h-7 w-7 shrink-0 rounded-full" style={{ background: r.color }} />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-semibold", r.you ? "text-violet-bright" : "text-ink")}>
                  {r.name} {r.you && <span className="text-ink-faint">(you)</span>}
                </p>
                <p className="nums text-[11px] text-ink-faint">
                  {r.wins}W · {r.losses}L · {r.draws}D
                </p>
              </div>
              <span
                className={cn(
                  "nums shrink-0 text-sm font-bold",
                  r.net > 0 ? "text-gold" : r.net < 0 ? "text-rose" : "text-ink-dim"
                )}
              >
                {signed(r.net)}
              </span>
            </motion.div>
          );
        })}
      </div>

      <RecentGames />
    </div>
  );
}

function RecentGames() {
  const { history } = useStore();
  if (history.length === 0) return null;
  return (
    <div className="mt-6">
      <p className="mb-2 text-[11px] uppercase tracking-widest text-ink-faint">Your recent games</p>
      <div className="flex flex-wrap gap-1.5">
        {history.slice(0, 12).map((g) => (
          <span
            key={g.id}
            title={`${g.mode} · ${signed(g.delta)} CELO`}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-lg text-[11px] font-bold",
              g.outcome === "win" && "bg-gold/15 text-gold",
              g.outcome === "lose" && "bg-rose/15 text-rose",
              g.outcome === "draw" && "bg-white/5 text-ink-faint"
            )}
          >
            {g.outcome === "win" ? "W" : g.outcome === "lose" ? "L" : "D"}
          </span>
        ))}
      </div>
    </div>
  );
}
