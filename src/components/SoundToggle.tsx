"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useStore, setSettings } from "@/lib/store";
import { play, unlockAudio } from "@/lib/sfx";

export function SoundToggle() {
  const { settings } = useStore();
  return (
    <button
      onClick={() => {
        unlockAudio();
        const next = !settings.soundOn;
        setSettings({ soundOn: next });
        if (next) play("select");
      }}
      aria-label={settings.soundOn ? "Mute sound" : "Unmute sound"}
      className="grid h-9 w-9 place-items-center rounded-full glass text-ink-dim transition-colors hover:text-ink"
    >
      {settings.soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  );
}
