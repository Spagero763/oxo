"use client";

import { getSettings } from "./store";

/* ----------------------------------------------------------------------------
   Web Audio sound design — every effect is synthesized in-browser (no asset
   files). Sounds are layered (a tonal body + a noise transient with real
   envelopes and filters) so they feel tactile instead of like a flat beep.
---------------------------------------------------------------------------- */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  return ctx;
}

/** Browsers start the audio context suspended until a user gesture. */
export function unlockAudio(): void {
  const ac = audio();
  if (ac && ac.state === "suspended") ac.resume().catch(() => {});
}

interface ToneOpts {
  freq: number;
  type?: OscillatorType;
  dur?: number;
  peak?: number;
  when?: number;
  sweepTo?: number;
  filter?: number;
  detune?: number;
}

function tone(o: ToneOpts) {
  const ac = audio();
  if (!ac || !master) return;
  const t0 = ac.currentTime + (o.when ?? 0);
  const dur = o.dur ?? 0.14;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.detune) osc.detune.setValueAtTime(o.detune, t0);
  if (o.sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.sweepTo), t0 + dur);

  let node: AudioNode = osc;
  if (o.filter) {
    const f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(o.filter, t0);
    osc.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(master);

  const peak = o.peak ?? 0.16;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

interface NoiseOpts {
  dur?: number;
  peak?: number;
  when?: number;
  filter?: number;
  sweepTo?: number;
  type?: BiquadFilterType;
}

function noise(o: NoiseOpts = {}) {
  const ac = audio();
  if (!ac || !master) return;
  const t0 = ac.currentTime + (o.when ?? 0);
  const dur = o.dur ?? 0.08;
  const buf = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = o.type ?? "lowpass";
  f.frequency.setValueAtTime(o.filter ?? 2400, t0);
  if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(Math.max(60, o.sweepTo), t0 + dur);
  f.Q.value = o.type === "bandpass" ? 1.2 : 0.7;
  const g = ac.createGain();
  src.connect(f);
  f.connect(g);
  g.connect(master);
  g.gain.setValueAtTime(o.peak ?? 0.16, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

export type Sfx =
  | "tap"
  | "placeX"
  | "placeO"
  | "win"
  | "lose"
  | "draw"
  | "coin"
  | "stake"
  | "select"
  | "whoosh";

export function play(sound: Sfx): void {
  const s = getSettings();
  if (!s.soundOn) return;
  const ac = audio();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});
  const v = Math.min(1, Math.max(0, s.volume));
  if (v <= 0) return;
  const V = (x: number) => x * v;

  switch (sound) {
    case "tap":
      tone({ freq: 660, type: "sine", dur: 0.05, peak: V(0.09) });
      break;

    case "select":
      tone({ freq: 520, type: "triangle", dur: 0.08, peak: V(0.12), sweepTo: 720 });
      noise({ dur: 0.03, peak: V(0.06), filter: 4000 });
      break;

    case "whoosh":
      noise({ dur: 0.22, peak: V(0.12), filter: 500, sweepTo: 5200, type: "bandpass" });
      break;

    case "placeX":
      // crisp marker stroke
      noise({ dur: 0.05, peak: V(0.16), filter: 4200, sweepTo: 1100 });
      tone({ freq: 300, type: "triangle", dur: 0.13, peak: V(0.17), sweepTo: 150 });
      tone({ freq: 150, type: "sine", dur: 0.1, peak: V(0.08), sweepTo: 90 });
      break;

    case "placeO":
      // rounder, slightly lower than X so turns are distinguishable by ear
      noise({ dur: 0.045, peak: V(0.13), filter: 3200, sweepTo: 800 });
      tone({ freq: 232, type: "sine", dur: 0.16, peak: V(0.18), sweepTo: 150 });
      tone({ freq: 116, type: "triangle", dur: 0.12, peak: V(0.08), sweepTo: 80 });
      break;

    case "stake":
      // a confident downward "lock" thunk
      tone({ freq: 420, type: "sine", dur: 0.1, peak: V(0.14), sweepTo: 180 });
      tone({ freq: 140, type: "triangle", dur: 0.18, peak: V(0.14), when: 0.04, sweepTo: 90 });
      noise({ dur: 0.06, peak: V(0.1), filter: 2200, when: 0.04 });
      break;

    case "coin":
      // bright two-note pickup, used on payout
      tone({ freq: 988, type: "square", dur: 0.08, peak: V(0.1) });
      tone({ freq: 1319, type: "square", dur: 0.16, peak: V(0.12), when: 0.07 });
      break;

    case "win":
      [523, 659, 784, 1046, 1318].forEach((f, i) =>
        tone({ freq: f, type: "sine", dur: 0.55, peak: V(0.16), when: i * 0.08 })
      );
      tone({ freq: 131, type: "triangle", dur: 0.6, peak: V(0.12), when: 0.32, sweepTo: 130 });
      [523, 659, 784, 1046].forEach((f) =>
        tone({ freq: f, type: "sine", dur: 0.85, peak: V(0.1), when: 0.42 })
      );
      [1318, 1568, 2093].forEach((f, i) =>
        tone({ freq: f, type: "triangle", dur: 0.45, peak: V(0.05), when: 0.5 + i * 0.05, filter: 6000 })
      );
      break;

    case "draw":
      [440, 440].forEach((f, i) =>
        tone({ freq: f, type: "sine", dur: 0.2, peak: V(0.12), when: i * 0.16 })
      );
      break;

    case "lose":
      [392, 330, 262].forEach((f, i) =>
        tone({ freq: f, type: "sine", dur: 0.34, peak: V(0.15), when: i * 0.13, sweepTo: f * 0.94, filter: 1800 })
      );
      break;
  }
}
