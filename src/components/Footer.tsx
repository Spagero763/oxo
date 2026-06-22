"use client";

import { ExternalLink } from "lucide-react";
import { OXO_CONTRACT, contractUrl, shortContract } from "@/lib/contract";

/* Small global footer that surfaces the live on-chain contract. */
export function Footer() {
  return (
    <footer className="mt-8 flex items-center justify-center gap-2 text-[11px] text-ink-faint">
      <span className="h-1.5 w-1.5 rounded-full bg-teal-bright/70" />
      <span>Onchain on Celo</span>
      <span className="text-ink-faint/50">·</span>
      <a
        href={contractUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-ink-dim transition-colors hover:text-ink"
        title={OXO_CONTRACT}
      >
        {shortContract()}
        <ExternalLink className="h-3 w-3" />
      </a>
    </footer>
  );
}
