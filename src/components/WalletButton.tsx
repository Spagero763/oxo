"use client";

import { Wallet, Loader2 } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { shortAddr } from "@/lib/format";
import { play } from "@/lib/sfx";

export function WalletButton() {
  const { address, connecting, available, miniPay, connect } = useWallet();

  if (address) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-semibold text-teal-bright">
        <span className="h-2 w-2 rounded-full bg-teal-bright shadow-[0_0_8px_#5eead4]" />
        {miniPay ? "MiniPay" : ""} {shortAddr(address)}
      </span>
    );
  }

  return (
    <button
      onClick={() => {
        play("tap");
        connect();
      }}
      disabled={connecting}
      className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-semibold text-ink-dim transition-colors hover:text-ink disabled:opacity-60"
    >
      {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
      {available ? "Connect" : "Play (demo)"}
    </button>
  );
}
