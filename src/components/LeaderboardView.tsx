"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import { fetchOnchainLeaderboard, type OnchainEntry } from "@/lib/onchainLeaderboard";
import { CELOSCAN, contractUrl } from "@/lib/contract";
import { signed, shortAddr } from "@/lib/format";
import { play } from "@/lib/sfx";
import { cn } from "@/lib/cn";

export function LeaderboardView({ onHome }: { onHome: () => void }) {
  const { wallets } = useWallets();
  const me = wallets[0]?.address?.toLowerCase();
  const [rows, setRows] = useState<OnchainEntry[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setRows(await fetchOnchainLeaderboard());
    } catch {
      setErr("Could not read the chain. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex w-full max-w-md flex-col">
      <div className="flex items-center justify-between">
        <button
          onClick={onHome}
          className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-sm text-ink-dim transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Lobby
        </button>
        <button
          onClick={() => { play("tap"); load(); }}
          className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-semibold text-gold"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Leaderboard
        </button>
      </div>

      <h1 className="mt-5 font-display text-3xl font-bold text-ink">
        Hall of <span className="text-gold">fame</span>
      </h1>
      <p className="mt-1 flex items-center gap-1 text-sm text-ink-dim">
        Live, on-chain results from
        <a href={contractUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-teal-bright">
          the escrow <ExternalLink className="h-3 w-3" />
        </a>
      </p>

      <div className="mt-5 flex flex-col gap-1.5">
        {loading && !rows && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-faint">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the chain…
          </div>
        )}

        {err && <p className="py-10 text-center text-sm text-rose">{err}</p>}

        {rows && rows.length === 0 && (
          <div className="rounded-3xl glass p-8 text-center">
            <p className="font-display text-lg font-bold text-ink">No games yet</p>
            <p className="mt-1 text-sm text-ink-dim">Be the first to stake, beat the bot, and top the board.</p>
          </div>
        )}

        {rows?.map((r, i) => {
          const rank = i + 1;
          const isMe = me && r.address.toLowerCase() === me;
          const podium = rank <= 3;
          return (
            <motion.a
              key={r.address}
              href={`${CELOSCAN}/address/${r.address}`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.035, 0.4) }}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors",
                isMe ? "glass-strong ring-1 ring-violet/40" : "bg-white/[0.02] hover:bg-white/[0.05]"
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
              <div className="min-w-0 flex-1">
                <p className={cn("nums truncate text-sm font-semibold", isMe ? "text-violet-bright" : "text-ink")}>
                  {shortAddr(r.address)} {isMe && <span className="text-ink-faint">(you)</span>}
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
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
