"use client";

import { parseAbiItem, formatEther } from "viem";
import { celoClient } from "./celo";
import { OXO_CONTRACT } from "./contract";

/* Real leaderboard, derived entirely from on-chain events emitted by the
   OXOArcade escrow. No backend, no seeded players — every row is a real wallet
   that has staked and settled a game on Celo mainnet. */

const DEPLOY_BLOCK = 70271479n;
const CHUNK = 4500n; // forno caps eth_getLogs at ~5000 blocks per call

const STAKED = parseAbiItem(
  "event Staked(bytes32 indexed gameId, address indexed player, uint256 stake, uint8 mode)"
);
const SETTLED = parseAbiItem(
  "event Settled(bytes32 indexed gameId, address indexed player, uint8 outcome, uint256 payout)"
);

export interface OnchainEntry {
  address: string;
  wins: number;
  losses: number;
  draws: number;
  games: number;
  net: number; // CELO
}

export async function fetchOnchainLeaderboard(): Promise<OnchainEntry[]> {
  const latest = await celoClient.getBlockNumber();
  const address = OXO_CONTRACT as `0x${string}`;

  const stakeByGame = new Map<string, bigint>();
  type Settle = { player: string; outcome: number; payout: bigint; gameId: string };
  const settled: Settle[] = [];

  for (let from = DEPLOY_BLOCK; from <= latest; from += CHUNK + 1n) {
    const to = from + CHUNK > latest ? latest : from + CHUNK;

    const [stakes, settles] = await Promise.all([
      celoClient.getLogs({ address, event: STAKED, fromBlock: from, toBlock: to }),
      celoClient.getLogs({ address, event: SETTLED, fromBlock: from, toBlock: to }),
    ]);

    for (const log of stakes) {
      const { gameId, stake } = log.args as { gameId: string; stake: bigint };
      stakeByGame.set(gameId, stake);
    }
    for (const log of settles) {
      const { gameId, player, outcome, payout } = log.args as {
        gameId: string;
        player: string;
        outcome: number;
        payout: bigint;
      };
      settled.push({ gameId, player, outcome: Number(outcome), payout });
    }
  }

  const byPlayer = new Map<string, OnchainEntry & { netWei: bigint }>();
  for (const s of settled) {
    const key = s.player.toLowerCase();
    const e =
      byPlayer.get(key) ??
      { address: s.player, wins: 0, losses: 0, draws: 0, games: 0, net: 0, netWei: 0n };
    const stake = stakeByGame.get(s.gameId) ?? 0n;
    e.games += 1;
    e.netWei += s.payout - stake; // win > 0, draw 0, loss < 0
    if (s.outcome === 2) e.wins += 1;
    else if (s.outcome === 1) e.draws += 1;
    else e.losses += 1;
    byPlayer.set(key, e);
  }

  return Array.from(byPlayer.values())
    .map((e) => ({ ...e, net: Number(formatEther(e.netWei)) }))
    .sort((a, b) => b.net - a.net || b.wins - a.wins);
}
