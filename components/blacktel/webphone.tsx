"use client";

import * as React from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Delete,
  Hash,
  Globe2,
  Clock,
  Sparkles,
  Zap,
  Radio,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VirtualNumber, WebphoneCallState } from "@/types/blacktel";
import { playDtmfTone, playRingTone } from "@/services/webphone";

interface WebphoneProps {
  activeNumbers?: VirtualNumber[];
  prefilledNumber?: string;
  onCallEnded?: () => void;
  className?: string;
}

export function Webphone({
  activeNumbers = [],
  prefilledNumber = "",
  onCallEnded,
  className = "",
}: WebphoneProps) {
  // Caller ID selection
  const defaultNumber = activeNumbers[0]?.phoneNumber || "+1 (415) 890-2314";
  const [selectedCallerId, setSelectedCallerId] = React.useState<string>(defaultNumber);

  // Number & State
  const [dialedDigits, setDialedDigits] = React.useState<string>(prefilledNumber);
  const [callState, setCallState] = React.useState<WebphoneCallState>("idle");
  const [callDuration, setCallDuration] = React.useState<number>(0);
  const [isMuted, setIsMuted] = React.useState<boolean>(false);
  const [isSpeaker, setIsSpeaker] = React.useState<boolean>(false);

  // Synchronize prefilled number
  React.useEffect(() => {
    if (prefilledNumber) {
      setDialedDigits(prefilledNumber);
    }
  }, [prefilledNumber]);

  // Call timer interval
  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (callState === "connected") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  // Keypad keys definitions
  const keypadKeys = [
    { key: "1", sub: "" },
    { key: "2", sub: "ABC" },
    { key: "3", sub: "DEF" },
    { key: "4", sub: "GHI" },
    { key: "5", sub: "JKL" },
    { key: "6", sub: "MNO" },
    { key: "7", sub: "PQRS" },
    { key: "8", sub: "TUV" },
    { key: "9", sub: "WXYZ" },
    { key: "*", sub: "" },
    { key: "0", sub: "+" },
    { key: "#", sub: "" },
  ];

  const handleKeyPress = (char: string) => {
    playDtmfTone(char);
    if (callState === "idle" || callState === "connected") {
      setDialedDigits((prev) => prev + char);
    }
  };

  const handleBackspace = () => {
    setDialedDigits((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDialedDigits("");
  };

  // Initiate Call
  const handleStartCall = async () => {
    if (!dialedDigits.trim() || callState !== "idle") return;

    setCallState("dialing");

    // Simulate dialing audio and transition to ringing
    setTimeout(() => {
      setCallState("ringing");
      const stopRing = playRingTone();

      // Simulate connected call after 2.5 seconds
      setTimeout(() => {
        stopRing();
        setCallState("connected");
      }, 2500);
    }, 1000);
  };

  // Hang Up Call
  const handleEndCall = async () => {
    const finalDuration = callDuration;
    setCallState("ended");

    // Log the call session in backend
    try {
      await fetch("/api/webphone/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromNumber: selectedCallerId,
          toNumber: dialedDigits,
          durationSeconds: finalDuration,
          status: "completed",
        }),
      });
    } catch (err) {
      console.error("Failed to log call:", err);
    }

    setTimeout(() => {
      setCallState("idle");
      if (onCallEnded) onCallEnded();
    }, 1500);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div
      className={`relative w-full max-w-[340px] sm:max-w-[360px] mx-auto bg-gradient-to-b from-card via-card to-background border-2 border-border/80 rounded-[2.5rem] shadow-2xl p-5 sm:p-6 overflow-hidden text-foreground ${className}`}
    >
      {/* Top Phone Speaker grill & camera notch */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        <div className="w-2.5 h-2.5 bg-muted-foreground/30 rounded-full" />
      </div>

      {/* Caller ID selector */}
      <div className="mb-3">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
          Caller ID (Virtual Outbound Line)
        </label>
        <div className="relative">
          <select
            value={selectedCallerId}
            onChange={(e) => setSelectedCallerId(e.target.value)}
            disabled={callState !== "idle"}
            className="w-full text-xs font-mono font-medium py-2 px-3 rounded-xl bg-muted/60 border border-border/70 text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {activeNumbers.length > 0 ? (
              activeNumbers.map((num) => (
                <option key={num.id} value={num.phoneNumber}>
                  {num.countryFlag} {num.phoneNumber} ({num.countryName})
                </option>
              ))
            ) : (
              <option value="+1 (415) 890-2314">🇺🇸 +1 (415) 890-2314 (US Virtual)</option>
            )}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Screen Display */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-center mb-4 min-h-[96px] flex flex-col justify-center relative overflow-hidden">
        {callState === "idle" && (
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-wider text-foreground break-all px-1">
              {dialedDigits || <span className="text-muted-foreground/40">Enter number</span>}
            </div>
            {dialedDigits && (
              <div className="flex items-center justify-center gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Delete className="w-3 h-3" /> Delete
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {callState === "dialing" && (
          <div className="animate-in fade-in-50 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
              Dialing...
            </span>
            <div className="text-lg font-bold font-mono text-primary">{dialedDigits}</div>
          </div>
        )}

        {callState === "ringing" && (
          <div className="animate-pulse space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-500 font-semibold uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-spin" />
              <span>Ringing...</span>
            </div>
            <div className="text-lg font-bold font-mono text-foreground">{dialedDigits}</div>
          </div>
        )}

        {callState === "connected" && (
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-500 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Connected • {formatTimer(callDuration)}</span>
            </div>
            <div className="text-base font-bold font-mono text-foreground">{dialedDigits}</div>
            <span className="text-[10px] text-muted-foreground font-mono">
              WebRTC Audio HD • 1 credit/min
            </span>
          </div>
        )}

        {callState === "ended" && (
          <div className="space-y-1 text-center">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              Call Ended
            </span>
            <div className="text-sm font-mono font-medium text-foreground">
              Duration: {formatTimer(callDuration)}
            </div>
          </div>
        )}
      </div>

      {/* In-Call Controls (shown when call is active) */}
      {callState === "connected" && (
        <div className="grid grid-cols-2 gap-2 mb-4 animate-in fade-in-50">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              isMuted
                ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                : "bg-muted/40 border-border/80 text-foreground"
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isMuted ? "Unmute" : "Mute"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              isSpeaker
                ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400"
                : "bg-muted/40 border-border/80 text-foreground"
            }`}
          >
            {isSpeaker ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{isSpeaker ? "Speaker On" : "Speaker"}</span>
          </button>
        </div>
      )}

      {/* Dialpad Keypad Matrix */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {keypadKeys.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleKeyPress(item.key)}
            className="flex flex-col items-center justify-center h-14 rounded-2xl bg-muted/50 hover:bg-muted border border-border/70 hover:border-border active:scale-95 transition-all shadow-sm group"
          >
            <span className="text-lg sm:text-xl font-bold font-mono text-foreground group-hover:text-primary transition-colors">
              {item.key}
            </span>
            {item.sub ? (
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest -mt-0.5">
                {item.sub}
              </span>
            ) : (
              <span className="h-2" />
            )}
          </button>
        ))}
      </div>

      {/* Main Action Call / Hangup Button */}
      <div className="flex items-center justify-center gap-4">
        {callState === "idle" ? (
          <button
            type="button"
            onClick={handleStartCall}
            disabled={!dialedDigits.trim()}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white shadow-xl shadow-emerald-600/30 transition-all"
            title="Start Call"
          >
            <PhoneCall className="w-7 h-7" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEndCall}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white shadow-xl shadow-red-600/30 transition-all animate-pulse"
            title="Hang Up"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        )}
      </div>

      {/* Echo Test / Quick Presets */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Test Echo Line:</span>
        <button
          type="button"
          onClick={() => setDialedDigits("*99#")}
          className="font-mono font-semibold text-primary hover:underline"
        >
          *99# (Audio Test)
        </button>
      </div>
    </div>
  );
}

