"use client";

import * as React from "react";
import {
  Signal,
  Wifi,
  Battery,
  ShieldCheck,
  CheckCheck,
  Globe2,
  Sparkles,
  Zap,
} from "lucide-react";
import { PhoneValidationResult } from "@/lib/phone-utils";
import { CountryData } from "@/lib/countries";
import { SmsMetrics } from "@/lib/sms-utils";

interface LiveMessagePreviewProps {
  messageText: string;
  phoneResult: PhoneValidationResult | null;
  selectedCountry: CountryData | null;
  metrics: SmsMetrics;
}

export function LiveMessagePreview({
  messageText,
  phoneResult,
  selectedCountry,
  metrics,
}: LiveMessagePreviewProps) {
  const displayFlag = selectedCountry?.flag || "🇮🇳";
  const displayCountry = selectedCountry?.name || "India";
  const displayDialCode = selectedCountry?.dialCode || "+91";
  const displayNumber = phoneResult?.international || `${displayDialCode} 98765 43210`;

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[380px] mx-auto select-none">
      {/* Decorative ambient blur behind phone */}
      <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-cyan-500/15 rounded-[2.8rem] blur-xl -z-10 animate-pulseGlow" />

      {/* Hardware Chassis */}
      <div className="relative rounded-[2.5rem] p-3 bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 shadow-2xl border border-white/50 dark:border-slate-800/80">
        
        {/* Screen */}
        <div className="relative rounded-[2rem] bg-background border border-border/60 overflow-hidden flex flex-col h-[520px] shadow-inner">
          
          {/* Status Bar */}
          <div className="px-5 pt-2.5 pb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">9:41</span>
            
            {/* Dynamic Island */}
            <div className="w-20 h-3.5 bg-slate-900 dark:bg-black rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            </div>

            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Recipient App Header */}
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border/60 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
              {displayFlag}
            </div>
            <div className="flex-1 truncate">
              <div className="text-xs font-bold text-foreground truncate flex items-center gap-1">
                <span>ReachOut SMS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="text-[10px] text-muted-foreground truncate font-mono">
                To: {displayNumber}
              </div>
            </div>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
              Tier-1
            </span>
          </div>

          {/* Conversation Screen Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-gradient-to-b from-background to-muted/20 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Date stamp */}
              <div className="flex justify-center">
                <span className="text-[9px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted/60">
                  Today • International SMS
                </span>
              </div>

              {/* Opt-in security token pill */}
              <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-0.5">
                <div className="flex items-center justify-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  Consent Token #OPT-RO-2026
                </div>
                <div className="text-[8px] text-muted-foreground">
                  Unsubscribe commands (STOP) honored automatically
                </div>
              </div>

              {/* Dynamic SMS Bubble */}
              <div className="flex flex-col items-end">
                <div className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-xs break-words whitespace-pre-wrap">
                  {messageText || (
                    <span className="italic opacity-70">
                      Message preview will appear here as you type...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-1 px-1 font-mono">
                  <span>Just now</span>
                  <CheckCheck className="w-3 h-3 text-cyan-400" />
                  <span>Delivered</span>
                </div>
              </div>
            </div>

            {/* Live Message Telemetry Pill at bottom of screen */}
            <div className="p-2.5 rounded-xl bg-card/90 border border-border/80 shadow-xs space-y-1 text-[10px]">
              <div className="flex items-center justify-between text-muted-foreground font-mono">
                <span>{metrics.charCount} characters</span>
                <span className="font-semibold text-foreground">{metrics.encoding}</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span className="text-primary">
                  {metrics.segmentCount} {metrics.segmentCount === 1 ? "Segment" : "Segments"}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  ~${metrics.estimatedCostUsd} USD
                </span>
              </div>
            </div>
          </div>

          {/* Phone Bottom bar */}
          <div className="px-3 py-2 bg-background border-t border-border/60 text-center">
            <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Real-Time Handset Simulation</span>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

