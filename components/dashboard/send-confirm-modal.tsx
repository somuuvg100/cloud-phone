"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  X,
  ShieldCheck,
  Globe2,
  Layers,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneValidationResult } from "@/lib/phone-utils";
import { SmsMetrics } from "@/lib/sms-utils";

interface SendConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSending: boolean;
  phoneResult: PhoneValidationResult;
  messageText: string;
  metrics: SmsMetrics;
}

export function SendConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isSending,
  phoneResult,
  messageText,
  metrics,
}: SendConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in-50">
      <div className="relative w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Confirm SMS Transmission
              </h3>
              <p className="text-xs text-muted-foreground">
                Review recipient, message segments, and delivery terms.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSending}
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recipient Details Card */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Destination Recipient
            </span>
            <Badge variant="success" className="text-[10px]">
              E.164 Verified
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-foreground">
                {phoneResult.international}
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                Normalized E.164: <span className="text-primary font-semibold">{phoneResult.e164}</span>
              </div>
            </div>
            <div className="text-xs font-mono px-2 py-1 rounded-lg bg-background border border-border/80 font-bold">
              {phoneResult.countryCode} ({phoneResult.dialCode})
            </div>
          </div>
        </div>

        {/* Message Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">
              Message Preview
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {metrics.charCount} characters • {metrics.encoding}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-background border border-border text-xs text-foreground leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap font-sans">
            {messageText}
          </div>
        </div>

        {/* Segment & Cost Summary */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-card border border-border/70 space-y-0.5">
            <span className="text-muted-foreground text-[11px] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              Billable Segments
            </span>
            <span className="text-sm font-bold text-foreground font-mono">
              {metrics.segmentCount} {metrics.segmentCount === 1 ? "Segment" : "Segments"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/70 space-y-0.5">
            <span className="text-muted-foreground text-[11px] flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              Estimated Telephony Cost
            </span>
            <span className="text-sm font-bold text-foreground font-mono text-emerald-600 dark:text-emerald-400">
              ~${metrics.estimatedCostUsd} USD
            </span>
          </div>
        </div>

        {/* Delivery Disclaimer & Warning Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <span className="font-bold">Carrier Delivery Notice:</span>
            <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
              The platform dispatches via Tier-1 carrier routes but cannot guarantee delivery to numbers that are blocked, disconnected, registered under national Do Not Disturb (DND) registries, or designated as fixed landlines.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSending}
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="glow"
            disabled={isSending}
            onClick={onConfirm}
            className="text-xs font-semibold gap-2 shadow-lg"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Dispatching via Twilio...</span>
              </>
            ) : (
              <>
                <span>Confirm & Dispatch SMS</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}

