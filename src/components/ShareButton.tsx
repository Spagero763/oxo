"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { play } from "@/lib/sfx";

const URL = "https://oxo-iota.vercel.app";
const TEXT = "I'm playing OXO — onchain noughts & crosses on Celo. Beat the bot, take the pot.";

export function ShareButton() {
  const [done, setDone] = useState(false);

  const share = async () => {
    play("tap");
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "OXO", text: TEXT, url: URL });
        return;
      }
      await navigator.clipboard.writeText(`${TEXT} ${URL}`);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <button
      onClick={share}
      className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-semibold text-ink-dim transition-colors hover:text-ink"
      aria-label="Share OXO"
    >
      {done ? <Check className="h-3.5 w-3.5 text-teal-bright" /> : <Share2 className="h-3.5 w-3.5" />}
      {done ? "Copied" : "Share"}
    </button>
  );
}
