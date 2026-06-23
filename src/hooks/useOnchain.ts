"use client";

import { useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, encodeFunctionData } from "viem";
import { celo } from "viem/chains";
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

export function useOnchain() {
  const { wallets } = useWallets();

  /** A viem wallet client for whatever wallet is connected (MetaMask OR the
   *  Privy embedded wallet), switched to Celo. Works for both. */
  const walletClientFor = useCallback(async () => {
    const wallet = wallets[0];
    if (!wallet) throw new Error("Connect a wallet first");
    try {
      await wallet.switchChain(celo.id);
    } catch {
      /* embedded wallets are already on Celo; ignore */
    }
    const provider = await wallet.getEthereumProvider();
    return createWalletClient({
      account: wallet.address as `0x${string}`,
      chain: celo,
      transport: custom(provider),
    });
  }, [wallets]);

  /** Stake into the escrow from the connected wallet and wait for it to mine. */
  const stake = useCallback(
    async (gameId: `0x${string}`, mode: Difficulty, stakeWei: string): Promise<`0x${string}`> => {
      const wc = await walletClientFor();
      const data = encodeFunctionData({
        abi: OXO_ABI,
        functionName: "stake",
        args: [gameId, MODE_INDEX[mode]],
      });
      const hash = await wc.sendTransaction({
        to: OXO_CONTRACT as `0x${string}`,
        value: BigInt(stakeWei),
        data,
      });
      await celoClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    [walletClientFor]
  );

  /** Plain CELO transfer from the connected wallet (used by the wallet panel). */
  const send = useCallback(
    async (to: `0x${string}`, value: bigint): Promise<`0x${string}`> => {
      const wc = await walletClientFor();
      const hash = await wc.sendTransaction({ to, value });
      return hash;
    },
    [walletClientFor]
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

  return { stake, send, settle };
}
