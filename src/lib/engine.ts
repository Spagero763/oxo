/* ----------------------------------------------------------------------------
   OXO game engine — board model, win detection, and a *fair* bot.

   Tic-tac-toe is a solved game: perfect play always ends in a draw, and a
   perfect bot can never be beaten. Staking real value against an unbeatable
   bot would be a rigged trap, so each difficulty deliberately blunders at a
   tuned rate. Hard is genuinely tough but still loseable — the stake is a real
   skill bet you can win.
---------------------------------------------------------------------------- */

export type Cell = "X" | "O" | null;
export type Board = Cell[]; // length 9, index 0..8 left-to-right, top-to-bottom

export const HUMAN: Cell = "X";
export const BOT: Cell = "O";

export const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export interface Outcome {
  winner: Cell; // null while in progress or on a draw
  line: number[] | null;
  draw: boolean;
}

export function emptyBoard(): Board {
  return Array(9).fill(null);
}

export function evaluate(board: Board): Outcome {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line, draw: false };
    }
  }
  const draw = board.every((c) => c !== null);
  return { winner: null, line: null, draw };
}

function openCells(board: Board): number[] {
  const out: number[] = [];
  for (let i = 0; i < 9; i++) if (!board[i]) out.push(i);
  return out;
}

/** Minimax with alpha-beta pruning — perfect play for `player`. */
export function bestMove(board: Board, player: "X" | "O"): number {
  const opponent = player === "X" ? "O" : "X";

  function score(b: Board, depth: number, isMax: boolean, alpha: number, beta: number): number {
    const o = evaluate(b);
    if (o.winner === player) return 10 - depth;
    if (o.winner === opponent) return depth - 10;
    if (o.draw) return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = player;
          best = Math.max(best, score(b, depth + 1, false, alpha, beta));
          b[i] = null;
          alpha = Math.max(alpha, best);
          if (beta <= alpha) break;
        }
      }
      return best;
    }
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = opponent;
        best = Math.min(best, score(b, depth + 1, true, alpha, beta));
        b[i] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  }

  let move = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = player;
      const s = score(board, 0, false, -Infinity, Infinity);
      board[i] = null;
      if (s > bestScore) {
        bestScore = s;
        move = i;
      }
    }
  }
  return move;
}

function randomCell(board: Board): number {
  const open = openCells(board);
  return open[Math.floor(Math.random() * open.length)] ?? -1;
}

export type Difficulty = "normal" | "hard";

/**
 * The bot's move. `blunderRate` is the chance it plays a random legal move
 * instead of the optimal one — that is the window the human can win through.
 *  - normal: blunders often, beatable with light attention
 *  - hard:   rarely blunders, demands real play, but still loseable
 */
export function botMove(board: Board, difficulty: Difficulty): number {
  const open = openCells(board);
  if (open.length === 0) return -1;
  const blunderRate = difficulty === "hard" ? 0.12 : 0.42;
  if (Math.random() < blunderRate) return randomCell(board);
  return bestMove(board, BOT as "O");
}
