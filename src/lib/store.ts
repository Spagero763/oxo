"use client";

import { useSyncExternalStore } from "react";
import type { Difficulty } from "./engine";
import { MODES } from "./modes";

/* ----------------------------------------------------------------------------
   A tiny localStorage-backed store with a React subscription. Holds the play
   balance, settings, lifetime stats, recent games and the leaderboard. Built
   to be swapped for an on-chain balance + backend leaderboard later — every
   write goes through one `mutate()` choke point.
---------------------------------------------------------------------------- */

export type Outcome = "win" | "lose" | "draw";

export interface Settings {
  name: string;
  soundOn: boolean;
  volume: number; // 0..1
}

export interface Stats {
  played: number;
  won: number;
  lost: number;
  drawn: number;
  net: number; // lifetime CELO profit/loss
  streak: number; // current win streak
  bestStreak: number;
}

export interface GameRecord {
  id: string;
  mode: Difficulty;
  outcome: Outcome;
  delta: number; // CELO change for this game
  at: number;
}

export interface LeaderEntry {
  id: string;
  name: string;
  color: string;
  wins: number;
  losses: number;
  draws: number;
  net: number;
  you?: boolean;
}

export interface State {
  balance: number; // play CELO available
  settings: Settings;
  stats: Stats;
  history: GameRecord[];
  rivals: LeaderEntry[]; // seeded opponents so the board feels alive
}

const KEY = "oxo:v1";
const STARTING_BALANCE = 0.001; // enough play CELO for ~1000 rounds

const RIVALS: LeaderEntry[] = [
  { id: "r1", name: "nova.celo", color: "#a892ff", wins: 41, losses: 12, draws: 9, net: 0.0000291 },
  { id: "r2", name: "zerocool", color: "#5eead4", wins: 38, losses: 20, draws: 14, net: 0.0000182 },
  { id: "r3", name: "graymatter", color: "#f6d66b", wins: 33, losses: 18, draws: 11, net: 0.0000165 },
  { id: "r4", name: "mira.eth", color: "#fb7185", wins: 29, losses: 22, draws: 8, net: 0.0000087 },
  { id: "r5", name: "the_grid", color: "#7c5cff", wins: 26, losses: 24, draws: 12, net: 0.0000031 },
  { id: "r6", name: "minipaymax", color: "#22d3c5", wins: 22, losses: 25, draws: 7, net: -0.0000022 },
  { id: "r7", name: "lattice", color: "#a892ff", wins: 18, losses: 27, draws: 6, net: -0.0000061 },
  { id: "r8", name: "checksum", color: "#f6d66b", wins: 14, losses: 31, draws: 5, net: -0.0000113 },
];

function freshState(): State {
  return {
    balance: STARTING_BALANCE,
    settings: { name: "You", soundOn: true, volume: 0.85 },
    stats: { played: 0, won: 0, lost: 0, drawn: 0, net: 0, streak: 0, bestStreak: 0 },
    history: [],
    rivals: RIVALS.map((r) => ({ ...r })),
  };
}

let state: State = freshState();
let hydrated = false;
const listeners = new Set<() => void>();

function load(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      state = { ...freshState(), ...parsed, settings: { ...freshState().settings, ...parsed.settings } };
    }
  } catch {
    /* corrupt storage — keep defaults */
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private-mode failures */
  }
}

function emit(): void {
  listeners.forEach((l) => l());
}

function mutate(next: Partial<State>): void {
  state = { ...state, ...next };
  persist();
  emit();
}

/* ----------------------------- subscription ------------------------------ */

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  // Hydrate from storage only after mount so the first client render matches
  // the server's default snapshot (no hydration mismatch), then notify.
  if (!hydrated) {
    load();
    queueMicrotask(emit);
  }
  return () => listeners.delete(cb);
}

/** Snapshot for useSyncExternalStore — must stay default-stable pre-hydration. */
export function getState(): State {
  return state;
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, getState, getState);
}

/* ------------------------------- actions --------------------------------- */

export function setSettings(patch: Partial<Settings>): void {
  load();
  mutate({ settings: { ...state.settings, ...patch } });
}

export function getSettings(): Settings {
  load();
  return state.settings;
}

/** Deducts a stake if affordable. Returns false when the balance is too low. */
export function placeStake(mode: Difficulty): boolean {
  load();
  const { stake } = MODES[mode];
  if (state.balance < stake) return false;
  mutate({ balance: round(state.balance - stake) });
  return true;
}

/** Refunds a placed stake (used if a staked game is abandoned before play). */
export function refundStake(mode: Difficulty): void {
  load();
  mutate({ balance: round(state.balance + MODES[mode].stake) });
}

/**
 * Settles a finished game: credits winnings/refund, updates stats, history and
 * the leaderboard. The stake was already removed by `placeStake`.
 * Returns the CELO delta for this game (relative to the stake).
 */
export function settleGame(mode: Difficulty, outcome: Outcome): number {
  load();
  const cfg = MODES[mode];
  let balanceCredit = 0; // returned to balance now
  let delta = 0; // net vs the stake

  if (outcome === "win") {
    balanceCredit = round(cfg.stake * cfg.payout); // stake back + winnings
    delta = round(cfg.stake * (cfg.payout - 1));
  } else if (outcome === "draw") {
    balanceCredit = cfg.stake; // stake refunded
    delta = 0;
  } else {
    balanceCredit = 0; // stake forfeited
    delta = round(-cfg.stake);
  }

  const s = state.stats;
  const streak = outcome === "win" ? s.streak + 1 : 0;
  const stats: Stats = {
    played: s.played + 1,
    won: s.won + (outcome === "win" ? 1 : 0),
    lost: s.lost + (outcome === "lose" ? 1 : 0),
    drawn: s.drawn + (outcome === "draw" ? 1 : 0),
    net: round(s.net + delta),
    streak,
    bestStreak: Math.max(s.bestStreak, streak),
  };

  const record: GameRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    mode,
    outcome,
    delta,
    at: Date.now(),
  };

  mutate({
    balance: round(state.balance + balanceCredit),
    stats,
    history: [record, ...state.history].slice(0, 30),
  });

  return delta;
}

export function resetBalance(): void {
  load();
  mutate({ balance: STARTING_BALANCE });
}

/** Builds the leaderboard with the live player slotted in, sorted by net. */
export function leaderboard(): LeaderEntry[] {
  load();
  const you: LeaderEntry = {
    id: "you",
    name: state.settings.name || "You",
    color: "#ffffff",
    wins: state.stats.won,
    losses: state.stats.lost,
    draws: state.stats.drawn,
    net: state.stats.net,
    you: true,
  };
  return [...state.rivals, you].sort((a, b) => b.net - a.net || b.wins - a.wins);
}

function round(n: number): number {
  return Math.round(n * 1e9) / 1e9;
}
