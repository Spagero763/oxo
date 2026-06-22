"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Flag } from "lucide-react";
import {
  emptyBoard,
  evaluate,
  botMove,
  HUMAN,
  BOT,
  type Board as BoardType,
} from "@/lib/engine";
import type { ModeConfig } from "@/lib/modes";
import { settleGame, useStore, type Outcome } from "@/lib/store";
import { play, unlockAudio } from "@/lib/sfx";
import { fmtCelo } from "@/lib/format";
import { Board } from "./Board";
import { MarkGlyph } from "./Mark";
import { ResultOverlay } from "./ResultOverlay";
import { cn } from "@/lib/cn";

type Turn = "X" | "O";

export function GameScreen({
  mode,
  onHome,
  onRematch,
}: {
  mode: ModeConfig;
  onHome: () => void;
  onRematch: () => void;
}) {
  const { balance, settings } = useStore();
  const [board, setBoard] = useState<BoardType>(() => emptyBoard());
  const [turn, setTurn] = useState<Turn>("X");
  const [result, setResult] = useState<Outcome | null>(null);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [lastMove, setLastMove] = useState<number | null>(null);
  const [delta, setDelta] = useState(0);
  const settledRef = useRef(false);

  const finish = useCallback(
    (b: BoardType, outcome: Outcome, line: number[] | null) => {
      if (settledRef.current) return;
      settledRef.current = true;
      setWinLine(line);
      setResult(outcome);
      const d = settleGame(mode.id, outcome);
      setDelta(d);
      window.setTimeout(() => {
        play(outcome === "win" ? "win" : outcome === "draw" ? "draw" : "lose");
        if (outcome === "win") window.setTimeout(() => play("coin"), 380);
      }, 280);
    },
    [mode.id]
  );

  // resolve a board into win/lose/draw from the human's perspective
  const settleBoard = useCallback(
    (b: BoardType): boolean => {
      const o = evaluate(b);
      if (o.winner) {
        finish(b, o.winner === HUMAN ? "win" : "lose", o.line);
        return true;
      }
      if (o.draw) {
        finish(b, "draw", null);
        return true;
      }
      return false;
    },
    [finish]
  );

  const human = (i: number) => {
    if (board[i] || result || turn !== "X") return;
    unlockAudio();
    const next = [...board];
    next[i] = HUMAN;
    setBoard(next);
    setLastMove(i);
    play("placeX");
    if (settleBoard(next)) return;
    setTurn("O");
  };

  // bot turn
  useEffect(() => {
    if (turn !== "O" || result) return;
    const t = window.setTimeout(() => {
      const b = [...board];
      const move = botMove(b, mode.id);
      if (move >= 0) {
        b[move] = BOT;
        setBoard(b);
        setLastMove(move);
        play("placeO");
      }
      if (!settleBoard(b)) setTurn("X");
    }, 520);
    return () => window.clearTimeout(t);
  }, [turn, board, result, settleBoard, mode.id]);

  const resign = () => {
    if (result) return;
    finish(board, "lose", null);
  };

  const accent = mode.accent === "violet" ? "#a892ff" : "#5eead4";
  const status = result
    ? "Round over"
    : turn === "X"
    ? "Your move"
    : "The machine is thinking";

  return (
    <div className="flex w-full max-w-md flex-col">
      <div className="flex items-center justify-between">
        <button
          onClick={onHome}
          className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-sm text-ink-dim transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Lobby
        </button>
        <span
          className="rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ background: `${accent}1a`, color: accent }}
        >
          {mode.name} · {fmtCelo(mode.stake)} CELO
        </span>
      </div>

      {/* players */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <PlayerTag name={settings.name || "You"} mark="X" active={turn === "X" && !result} />
        <span className="text-xs font-semibold text-ink-faint">VS</span>
        <PlayerTag name="The Machine" mark="O" active={turn === "O" && !result} alignRight />
      </div>

      <motion.p
        key={status}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 text-center text-sm text-ink-dim"
      >
        {status}
      </motion.p>

      <div className="relative mt-3">
        <Board
          board={board}
          onCell={human}
          disabled={turn !== "X" || !!result}
          winLine={winLine}
          lastMove={lastMove}
        />
        <AnimatePresence>
          {result && (
            <ResultOverlay
              outcome={result}
              mode={mode}
              delta={delta}
              balance={balance}
              onRematch={onRematch}
              onHome={onHome}
            />
          )}
        </AnimatePresence>
      </div>

      {!result && (
        <button
          onClick={resign}
          className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-ink-faint transition-colors hover:text-rose"
        >
          <Flag className="h-3.5 w-3.5" /> Resign (forfeit stake)
        </button>
      )}
    </div>
  );
}

function PlayerTag({
  name,
  mark,
  active,
  alignRight,
}: {
  name: string;
  mark: "X" | "O";
  active: boolean;
  alignRight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 items-center gap-2.5 rounded-2xl px-3 py-2.5 transition-all duration-300",
        active ? "glass ring-1 ring-white/15" : "bg-white/[0.02]",
        alignRight && "flex-row-reverse text-right"
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5">
        <MarkGlyph kind={mark} className="h-5 w-5" />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold text-ink">{name}</p>
        <p className={cn("text-[10px]", active ? "text-teal-bright" : "text-ink-faint")}>
          {active ? "to move" : "waiting"}
        </p>
      </div>
    </div>
  );
}
