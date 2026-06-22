"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Board as BoardType } from "@/lib/engine";
import { Mark } from "./Mark";
import { cn } from "@/lib/cn";

function cellCenter(i: number): { x: number; y: number } {
  const col = i % 3;
  const row = Math.floor(i / 3);
  return { x: ((col + 0.5) / 3) * 100, y: ((row + 0.5) / 3) * 100 };
}

export function Board({
  board,
  onCell,
  disabled,
  winLine,
  lastMove,
}: {
  board: BoardType;
  onCell: (i: number) => void;
  disabled: boolean;
  winLine: number[] | null;
  lastMove: number | null;
}) {
  const a = winLine ? cellCenter(winLine[0]) : null;
  const c = winLine ? cellCenter(winLine[2]) : null;
  const winColor = winLine && board[winLine[0]] === "X" ? "#a892ff" : "#5eead4";

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[360px] rounded-[28px] glass p-3 shadow-card">
      <div className="grid h-full w-full grid-cols-3 grid-rows-3">
        {board.map((cell, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const playable = !disabled && !cell;
          const inWin = winLine?.includes(i);
          return (
            <button
              key={i}
              onClick={() => onCell(i)}
              disabled={!playable}
              aria-label={`cell ${i + 1}${cell ? `, ${cell}` : ""}`}
              className={cn(
                "group relative grid place-items-center transition-colors duration-200",
                col < 2 && "border-r-2 border-white/10",
                row < 2 && "border-b-2 border-white/10",
                playable && "hover:bg-white/[0.05]",
                inWin && "bg-gold/10"
              )}
            >
              {/* hover ghost showing where your mark will land */}
              {playable && (
                <span className="pointer-events-none absolute h-[55%] w-[55%] rounded-full bg-violet/0 opacity-0 ring-1 ring-violet/40 transition-opacity duration-200 group-hover:opacity-100" />
              )}
              <div className="pointer-events-none relative h-full w-full">
                <AnimatePresence>{cell && <Mark key={cell + i} kind={cell} />}</AnimatePresence>
              </div>
              {/* last-move pulse */}
              {lastMove === i && cell && (
                <motion.span
                  className="pointer-events-none absolute inset-2 rounded-2xl"
                  initial={{ boxShadow: "0 0 0 0 rgba(168,146,255,0.5)" }}
                  animate={{ boxShadow: "0 0 0 12px rgba(168,146,255,0)" }}
                  transition={{ duration: 0.7 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* winning line */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-3">
        <AnimatePresence>
          {a && c && (
            <motion.line
              x1={a.x}
              y1={a.y}
              x2={c.x}
              y2={c.y}
              stroke={winColor}
              strokeWidth={3}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
              style={{ filter: `drop-shadow(0 0 6px ${winColor})` }}
            />
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}
