import { CallLogEntry } from "@/types/blacktel";
import { deductCredits } from "./wallet";

// Standard DTMF Frequencies (Dual-Tone Multi-Frequency)
const DTMF_FREQUENCIES: Record<string, [number, number]> = {
  "1": [697, 1209],
  "2": [697, 1336],
  "3": [697, 1477],
  "4": [770, 1209],
  "5": [770, 1336],
  "6": [770, 1477],
  "7": [852, 1209],
  "8": [852, 1336],
  "9": [852, 1477],
  "*": [941, 1209],
  "0": [941, 1336],
  "#": [941, 1477],
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays authentic DTMF telephone dialpad sound for a given keypad character
 */
export function playDtmfTone(char: string, durationMs = 120) {
  const freqs = DTMF_FREQUENCIES[char];
  if (!freqs) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(freqs[0], ctx.currentTime);
    osc2.frequency.setValueAtTime(freqs[1], ctx.currentTime);

    // Soft volume envelope
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + durationMs / 1000
    );

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(ctx.currentTime + durationMs / 1000);
    osc2.stop(ctx.currentTime + durationMs / 1000);
  } catch (err) {
    console.debug("Audio play error:", err);
  }
}

/**
 * Plays telephone ringing tone (440Hz + 480Hz US standard tone)
 */
export function playRingTone(): () => void {
  const ctx = getAudioContext();
  if (!ctx) return () => {};

  let isPlaying = true;
  let osc1: OscillatorNode | null = null;
  let osc2: OscillatorNode | null = null;
  let gainNode: GainNode | null = null;

  try {
    osc1 = ctx.createOscillator();
    osc2 = ctx.createOscillator();
    gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.setValueAtTime(480, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
  } catch (err) {
    console.debug("Ring audio error:", err);
  }

  return () => {
    isPlaying = false;
    try {
      if (osc1) osc1.stop();
      if (osc2) osc2.stop();
    } catch {}
  };
}

// In-Memory Call Logs store
let callLogsStore: CallLogEntry[] = [
  {
    id: "call_01",
    virtualNumberId: "vn_reachout_us_01",
    direction: "outbound",
    fromNumber: "+1 (415) 890-2314",
    toNumber: "+1 (415) 555-0144",
    durationSeconds: 142,
    status: "completed",
    costCredits: 2,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    countryFlag: "🇺🇸",
  },
  {
    id: "call_02",
    virtualNumberId: "vn_reachout_uk_02",
    direction: "inbound",
    fromNumber: "+44 7911 998877",
    toNumber: "+44 7911 123456",
    durationSeconds: 45,
    status: "completed",
    costCredits: 1,
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
    countryFlag: "🇬🇧",
  },
  {
    id: "call_03",
    virtualNumberId: "vn_reachout_us_01",
    direction: "outbound",
    fromNumber: "+1 (415) 890-2314",
    toNumber: "+1 (212) 555-0199",
    durationSeconds: 0,
    status: "no_answer",
    costCredits: 0,
    createdAt: new Date(Date.now() - 400 * 60000).toISOString(),
    countryFlag: "🇺🇸",
  },
];

export function getCallLogs(): CallLogEntry[] {
  return [...callLogsStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function logCallCompletion(
  virtualNumberId: string,
  fromNumber: string,
  toNumber: string,
  durationSeconds: number,
  status: CallLogEntry["status"] = "completed"
): CallLogEntry {
  const creditsCost = durationSeconds > 0 ? Math.ceil(durationSeconds / 60) : 0;

  if (creditsCost > 0) {
    deductCredits(
      undefined,
      creditsCost,
      "call_outbound",
      `Call to ${toNumber} (${durationSeconds}s)`
    );
  }

  let flag = "🌐";
  if (toNumber.startsWith("+1")) flag = "🇺🇸";
  else if (toNumber.startsWith("+44")) flag = "🇬🇧";
  else if (toNumber.startsWith("+49")) flag = "🇩🇪";

  const newLog: CallLogEntry = {
    id: `call_${Date.now()}`,
    virtualNumberId,
    direction: "outbound",
    fromNumber,
    toNumber,
    durationSeconds,
    status,
    costCredits: creditsCost,
    createdAt: new Date().toISOString(),
    countryFlag: flag,
  };

  callLogsStore.unshift(newLog);
  return newLog;
}

