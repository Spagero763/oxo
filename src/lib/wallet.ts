"use client";

import { useCallback, useEffect, useState } from "react";

/* ----------------------------------------------------------------------------
   Wallet layer — Celo, MiniPay-aware, dependency-free (raw EIP-1193 injected
   provider). It handles connect / address / chain. Staking against a bot can't
   be settled trustlessly without a deployed house contract, so the play
   balance lives in the local store; this module is the identity + the seam
   where a real on-chain stake transfer gets wired in (see `payStake`).
---------------------------------------------------------------------------- */

export const CELO_MAINNET = {
  chainIdHex: "0xa4ec", // 42220
  chainId: 42220,
  params: {
    chainId: "0xa4ec",
    chainName: "Celo",
    nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
    rpcUrls: ["https://forno.celo.org"],
    blockExplorerUrls: ["https://celoscan.io"],
  },
};

interface Eip1193 {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
  isMiniPay?: boolean;
}

function provider(): Eip1193 | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: Eip1193 }).ethereum ?? null;
}

export function isMiniPay(): boolean {
  return Boolean(provider()?.isMiniPay);
}

export function hasWallet(): boolean {
  return Boolean(provider());
}

async function ensureCelo(p: Eip1193): Promise<void> {
  try {
    await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CELO_MAINNET.chainIdHex }] });
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code === 4902) {
      await p.request({ method: "wallet_addEthereumChain", params: [CELO_MAINNET.params] });
    }
  }
}

export interface WalletState {
  address: `0x${string}` | null;
  connecting: boolean;
  miniPay: boolean;
  available: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [miniPay, setMiniPay] = useState(false);
  const [available, setAvailable] = useState(false);

  const connect = useCallback(async () => {
    const p = provider();
    if (!p) return;
    setConnecting(true);
    try {
      await ensureCelo(p);
      const accounts = (await p.request({ method: "eth_requestAccounts" })) as string[];
      if (accounts?.[0]) setAddress(accounts[0] as `0x${string}`);
    } catch {
      /* user rejected — stay disconnected */
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => setAddress(null), []);

  useEffect(() => {
    const p = provider();
    setAvailable(Boolean(p));
    setMiniPay(Boolean(p?.isMiniPay));
    if (!p) return;

    // MiniPay injects an already-authorized account — auto-connect there.
    if (p.isMiniPay) {
      connect();
    } else {
      p.request({ method: "eth_accounts" })
        .then((a) => {
          const accs = a as string[];
          if (accs?.[0]) setAddress(accs[0] as `0x${string}`);
        })
        .catch(() => {});
    }

    const onAccounts = (...args: unknown[]) => {
      const accs = args[0] as string[];
      setAddress((accs?.[0] as `0x${string}`) ?? null);
    };
    p.on?.("accountsChanged", onAccounts);
    return () => p.removeListener?.("accountsChanged", onAccounts);
  }, [connect]);

  return { address, connecting, miniPay, available, connect, disconnect };
}

/**
 * Seam for the real on-chain stake. Today it resolves immediately (the local
 * play balance is the source of truth). When the house/escrow contract is
 * deployed, send the stake here and await the receipt.
 */
export async function payStake(_address: string, _stakeWei: string): Promise<{ ok: true }> {
  return { ok: true };
}
