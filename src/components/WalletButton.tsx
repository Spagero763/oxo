"use client";

import { Wallet, Loader2 } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { shortAddr } from "@/lib/format";
import { play } from "@/lib/sfx";

/** Connect via Privy when logged out; show the wallet (opens panel) when in. */
export function WalletButton({ onOpenWallet }: { onOpenWallet?: () => void }) {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const address = wallets[0]?.address;

  if (!ready) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs text-ink-faint">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    );
  }

  if (authenticated && address) {
    return (
      <button
        onClick={() => {
          play("tap");
          onOpenWallet?.();
        }}
        className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-semibold text-teal-bright"
      >
        <span className="h-2 w-2 rounded-full bg-teal-bright shadow-[0_0_8px_#5eead4]" />
        {shortAddr(address)}
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        play("tap");
        login();
      }}
      className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-semibold text-ink-dim transition-colors hover:text-ink"
    >
      <Wallet className="h-3.5 w-3.5" />
      Connect
    </button>
  );
}
