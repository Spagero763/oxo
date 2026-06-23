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

export interface State {
  balance: number; // demo CELO, only used when on-chain staking is off (local dev)
  settings: Settings;
  stats: Stats;
  history: GameRecord[];
}

const KEY = "oxo:v1";
const STARTING_BALANCE = 0.001;

function freshState(): State {
  return {
    balance: STARTING_BALANCE,
    settings: { name: "You", soundOn: true, volume: 0.85 },
    stats: { played: 0, won: 0, lost: 0, drawn: 0, net: 0, streak: 0, bestStreak: 0 },
    history: [],
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
export function settleGame(mode: Difficulty, outcome: Outcome, opts?: { onchain?: boolean }): number {
  load();
  const cfg = MODES[mode];
  const onchain = opts?.onchain ?? false;
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
    // on-chain games move real funds via the contract, so leave the demo balance alone
    balance: onchain ? state.balance : round(state.balance + balanceCredit),
    stats,
    history: [record, ...state.history].slice(0, 30),
  });

  return delta;
}

export function resetBalance(): void {
  load();
  mutate({ balance: STARTING_BALANCE });
}

function round(n: number): number {
  return Math.round(n * 1e9) / 1e9;
}
