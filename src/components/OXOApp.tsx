"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MODES } from "@/lib/modes";
import { placeStake } from "@/lib/store";
import { play, unlockAudio } from "@/lib/sfx";
import type { Difficulty } from "@/lib/engine";
import { Background } from "./Background";
import { TopBar } from "./TopBar";
import { Home } from "./Home";
import { GameScreen } from "./GameScreen";
import { LeaderboardView } from "./LeaderboardView";

type Screen = "home" | "game" | "leaderboard";

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

  const startMatch = useCallback((m: Difficulty) => {
    unlockAudio();
    if (!placeStake(m)) {
      play("lose");
      return;
    }
    play("stake");
    setMode(m);
    setMatchKey((k) => k + 1);
    setScreen("game");
  }, []);

  const goHome = useCallback(() => {
    play("tap");
    setScreen("home");
  }, []);

  return (
    <main className="relative min-h-[100dvh]">
      <Background />
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-10 pt-5">
        <TopBar onHome={goHome} />

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
                />
              </motion.div>
            )}

            {screen === "leaderboard" && (
              <motion.div key="lb" {...screenMotion} className="flex w-full justify-center">
                <LeaderboardView onHome={goHome} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
