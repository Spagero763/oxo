"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, AlertTriangle } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { MODES } from "@/lib/modes";
import { placeStake } from "@/lib/store";
import { play, unlockAudio } from "@/lib/sfx";
import { useOnchain, ONCHAIN_ENABLED, newGameId } from "@/hooks/useOnchain";
import type { Difficulty } from "@/lib/engine";
import { Background } from "./Background";
import { TopBar } from "./TopBar";
import { Home } from "./Home";
import { GameScreen } from "./GameScreen";
import { LeaderboardView } from "./LeaderboardView";
import { WalletScreen } from "./WalletScreen";
import { Footer } from "./Footer";

type Screen = "home" | "game" | "leaderboard" | "wallet";
type OnchainCtx = { gameId: `0x${string}`; player: string };

const screenMotion = {
  initial: { opacity: 0, y: 18, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -14, scale: 0.99 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
};

export function OXOApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<Difficulty>("normal");
  const [matchKey, setMatchKey] = useState(0);
  const [onchainCtx, setOnchainCtx] = useState<OnchainCtx | null>(null);
  const [staking, setStaking] = useState(false);
  const [stakeErr, setStakeErr] = useState<string | null>(null);

  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const address = wallets[0]?.address;
  const { stake } = useOnchain();

  const startMatch = useCallback(
    async (m: Difficulty) => {
      unlockAudio();
      setStakeErr(null);

      // Real on-chain staking (enabled via env + a connected wallet)
      if (ONCHAIN_ENABLED) {
        if (!authenticated || !address) {
          play("tap");
          login();
          return;
        }
        setStaking(true);
        try {
          const gameId = newGameId();
          await stake(gameId, m, MODES[m].stakeWei);
          setOnchainCtx({ gameId, player: address });
          play("stake");
          setMode(m);
          setMatchKey((k) => k + 1);
          setScreen("game");
        } catch (e: unknown) {
          play("lose");
          setStakeErr((e as { shortMessage?: string; message?: string })?.shortMessage ?? (e as Error)?.message ?? "Stake failed");
        } finally {
          setStaking(false);
        }
        return;
      }

      // Demo path: local play balance
      if (!placeStake(m)) {
        play("lose");
        setStakeErr("Balance too low — top up your demo balance.");
        return;
      }
      setOnchainCtx(null);
      play("stake");
      setMode(m);
      setMatchKey((k) => k + 1);
      setScreen("game");
    },
    [authenticated, address, login, stake]
  );

  const goHome = useCallback(() => {
    play("tap");
    setScreen("home");
  }, []);

  return (
    <main className="relative min-h-[100dvh]">
      <Background />
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-10 pt-5">
        <TopBar onHome={goHome} onOpenWallet={() => { play("select"); setScreen("wallet"); }} />

        {stakeErr && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{stakeErr}</span>
            <button onClick={() => setStakeErr(null)} className="font-semibold">Dismiss</button>
          </div>
        )}

        <div className="flex flex-1 items-start justify-center pt-2">
          <AnimatePresence mode="wait">
            {screen === "home" && (
              <motion.div key="home" {...screenMotion} className="w-full">
                <Home onPlay={startMatch} onLeaderboard={() => { play("select"); setScreen("leaderboard"); }} />
              </motion.div>
            )}

            {screen === "game" && (
              <motion.div key={`game-${matchKey}`} {...screenMotion} className="flex w-full justify-center pt-4">
                <GameScreen
                  mode={MODES[mode]}
                  onHome={goHome}
                  onRematch={() => startMatch(mode)}
                  onchain={onchainCtx ?? undefined}
                />
              </motion.div>
            )}

            {screen === "leaderboard" && (
              <motion.div key="lb" {...screenMotion} className="flex w-full justify-center">
                <LeaderboardView onHome={goHome} />
              </motion.div>
            )}

            {screen === "wallet" && (
              <motion.div key="wallet" {...screenMotion} className="flex w-full justify-center">
                <WalletScreen onHome={goHome} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Footer />
      </div>

      {/* staking overlay */}
      <AnimatePresence>
        {staking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-void/80 backdrop-blur-md"
          >
            <div className="flex flex-col items-center gap-3 rounded-3xl glass-strong px-8 py-7 text-center shadow-card">
              <Loader2 className="h-7 w-7 animate-spin text-violet-bright" />
              <p className="font-display text-lg font-bold text-ink">Confirming your stake</p>
              <p className="max-w-[16rem] text-xs text-ink-dim">Approve the transaction in your wallet. Your stake locks into the on-chain escrow.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
