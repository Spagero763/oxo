"use client";

import { motion } from "framer-motion";
import { useCeloBalance } from "@/hooks/useCeloBalance";
import { fmtCelo } from "@/lib/format";
import { WalletButton } from "./WalletButton";
import { SoundToggle } from "./SoundToggle";
import { MarkGlyph } from "./Mark";

export function TopBar({ onHome, onOpenWallet }: { onHome?: () => void; onOpenWallet?: () => void }) {
  const { address, balance } = useCeloBalance();

  return (
    <header className="flex items-center justify-between gap-3">
      <button onClick={onHome} className="group flex items-center gap-2">
        <span className="relative grid h-9 w-9 place-items-center rounded-xl ring-grad p-[1.5px]">
          <span className="grid h-full w-full place-items-center rounded-[10px] bg-void">
            <span className="flex">
              <MarkGlyph kind="O" className="h-4 w-4" />
              <MarkGlyph kind="X" className="-ml-1 h-4 w-4" />
            </span>
          </span>
        </span>
        <span className="font-display text-lg font-bold tracking-tight text-ink">OXO</span>
      </button>

      <div className="flex items-center gap-2">
        {address && (
          <motion.button
            onClick={onOpenWallet}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            className="rounded-full glass px-3 py-1.5 text-xs font-semibold"
          >
            <span className="nums text-ink">{balance === null ? "…" : fmtCelo(balance)}</span>{" "}
            <span className="text-ink-faint">CELO</span>
          </motion.button>
        )}
        <WalletButton onOpenWallet={onOpenWallet} />
        <SoundToggle />
      </div>
    </header>
  );
}
