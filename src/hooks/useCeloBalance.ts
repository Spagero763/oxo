"use client";

import { useEffect, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { celoBalance } from "@/lib/celo";

/** Live CELO balance of the connected embedded wallet, polled gently. */
export function useCeloBalance() {
  const { wallets } = useWallets();
  const address = wallets[0]?.address as `0x${string}` | undefined;
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!address) {
      setBalance(null);
      return;
    }
    let live = true;
    const load = () => celoBalance(address).then((b) => live && setBalance(b)).catch(() => {});
    load();
    const t = setInterval(load, 15000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [address]);

  return { address, balance };
}
