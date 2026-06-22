import type { Difficulty } from "./engine";

export interface ModeConfig {
  id: Difficulty;
  name: string;
  tagline: string;
  blurb: string;
  /** Stake required to enter, in CELO. */
  stake: number;
  /** Stake in wei (CELO has 18 decimals), as a string for safe transport. */
  stakeWei: string;
  /** Total return on a win, as a multiple of the stake (includes the stake). */
  payout: number;
  accent: "violet" | "teal";
  blunderHint: string;
}

/** 0.000001 CELO = 1e12 wei. */
const STAKE_CELO = 0.000001;
const STAKE_WEI = "1000000000000";

export const MODES: Record<Difficulty, ModeConfig> = {
  normal: {
    id: "normal",
    name: "Normal",
    tagline: "Warm up",
    blurb: "The machine plays smart but slips. Stay sharp and the win is yours.",
    stake: STAKE_CELO,
    stakeWei: STAKE_WEI,
    payout: 2,
    accent: "violet",
    blunderHint: "Beatable",
  },
  hard: {
    id: "hard",
    name: "Hard",
    tagline: "Prove it",
    blurb: "Near-perfect defence. Force the mistake and triple your stake.",
    stake: STAKE_CELO,
    stakeWei: STAKE_WEI,
    payout: 3,
    accent: "teal",
    blunderHint: "Brutal but loseable",
  },
};

export const MODE_LIST: ModeConfig[] = [MODES.normal, MODES.hard];
