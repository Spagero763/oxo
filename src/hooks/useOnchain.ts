"use client";

import { useCallback } from "react";
import { useSendTransaction } from "@privy-io/react-auth";
import { encodeFunctionData } from "viem";
import { celoClient } from "@/lib/celo";
import { OXO_ABI, MODE_INDEX } from "@/lib/oxoAbi";
import { OXO_CONTRACT } from "@/lib/contract";
import type { Difficulty } from "@/lib/engine";
import type { Outcome } from "@/lib/store";

export const ONCHAIN_ENABLED = process.env.NEXT_PUBLIC_ONCHAIN_STAKING === "1";

/** Random bytes32 game id. */
export function newGameId(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return ("0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
}

function txHashOf(res: unknown): `0x${string}` {
  const h =
    (res as { hash?: string })?.hash ??
    (res as { transactionHash?: string })?.transactionHash ??
    (typeof res === "string" ? res : null);
  if (!h) throw new Error("No transaction hash returned");
  return h as `0x${string}`;
}

export function useOnchain() {
  const { sendTransaction } = useSendTransaction();

  /** Send the stake tx from the embedded wallet and wait for it to mine. */
  const stake = useCallback(
    async (gameId: `0x${string}`, mode: Difficulty, stakeWei: string): Promise<`0x${string}`> => {
      const data = encodeFunctionData({
        abi: OXO_ABI,
        functionName: "stake",
        args: [gameId, MODE_INDEX[mode]],
      });
      const res = await sendTransaction({
        to: OXO_CONTRACT as `0x${string}`,
        value: BigInt(stakeWei),
        data,
        chainId: 42220,
      });
      const hash = txHashOf(res);
      await celoClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    [sendTransaction]
  );

  /** Ask the relayer backend to settle the result, then wait for the tx. */
  const settle = useCallback(
    async (args: {
      gameId: `0x${string}`;
      mode: Difficulty;
      board: (string | null)[];
      outcome: Outcome;
      player: string;
    }): Promise<`0x${string}`> => {
      const r = await fetch("/api/settle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(args),
      });
      const json = (await r.json()) as { txHash?: `0x${string}`; error?: string };
      if (!r.ok || !json.txHash) throw new Error(json.error ?? "Settlement failed");
      await celoClient.waitForTransactionReceipt({ hash: json.txHash });
      return json.txHash;
    },
    []
  );

  return { stake, settle };
}
