"use client";

import * as React from "react";
import Link from "next/link";
import {
  Send,
  Globe2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Loader2,
  Phone,
  Eye,
  FileText,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { PhoneValidationResult } from "@/lib/phone-utils";
import { CountryData, COUNTRIES } from "@/lib/countries";
import { calculateSmsMetrics } from "@/lib/sms-utils";
import { SendConfirmModal } from "@/components/dashboard/send-confirm-modal";
import { LiveMessagePreview } from "@/components/dashboard/live-message-preview";
import { SecurityChallengeModal } from "@/components/security/security-challenge-modal";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  insertMessage,
  recordConsent,
  recordMessageSentAndCheckAllowance,
} from "@/services/database";

export default function SendMessagePage() {
  const [phoneResult, setPhoneResult] = React.useState<PhoneValidationResult | null>(null);
  const [selectedCountry, setSelectedCountry] = React.useState<CountryData | null>(COUNTRIES[0]);
  const [messageText, setMessageText] = React.useState("");
  const [consentConfirmed, setConsentConfirmed] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [mobileTab, setMobileTab] = React.useState<"compose" | "preview">("compose");
  const [apiError, setApiError] = React.useState<string | null>(null);

  // Security Challenge State (Phase 10)
  const [showSecurityChallenge, setShowSecurityChallenge] = React.useState(false);
  const [challengeReason, setChallengeReason] = React.useState(
    "Rapid message activity detected. Please complete human verification to continue."
  );

  const [dispatchResult, setDispatchResult] = React.useState<{
    success: boolean;
    id: string;
    e164: string;
    recipientFormatted: string;
    segments: number;
    cost: string;
    timestamp: string;
    isSimulated?: boolean;
    warning?: string;
  } | null>(null);

  // Calculate live SMS metrics (GSM-7 vs UCS-2, segments, remaining chars, cost)
  const metrics = React.useMemo(() => {
    return calculateSmsMetrics(messageText);
  }, [messageText]);

  // Canned templates for quick insertion
  const cannedTemplates = [
    {
      title: "2FA Verification Code",
      text: "Your ReachOut verification code is 492-810. Valid for 10 minutes. Do not share.",
    },
    {
      title: "Appointment Reminder",
      text: "Hi Sarah! Your appointment with ReachOut Studio is confirmed for tomorrow at 10:00 AM. Reply STOP to cancel.",
    },
    {
      title: "Order Dispatch",
      text: "Great news! Order #RO-9821 has been dispatched via Express Courier. Live tracking: https://reachout.global/track/9821",
    },
    {
      title: "Security Notice",
      text: "ReachOut Security Alert: A new login was observed from Chrome on macOS. If this wasn't you, revoke session immediately.",
    },
  ];

  // Validation rules for enabling the trigger button
  const isMessageValid = messageText.trim().length > 0;
  const isPhoneValid = Boolean(phoneResult?.isValid);
  const canProceed = isMessageValid && isPhoneValid && consentConfirmed && !isSending;

  // Open confirmation modal
  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed || !phoneResult) return;
    setShowConfirmModal(true);
  };

  // Perform actual dispatch via secure server-side POST /api/messages/send
  const handleConfirmSend = async () => {
    if (!phoneResult || isSending) return;

    setIsSending(true);
    setApiError(null);

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientPhone: phoneResult.e164,
          recipientCountry: selectedCountry?.name || phoneResult.countryCode,
          messageBody: messageText.trim(),
          consentConfirmed: true,
          idempotencyKey: `ro_tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setChallengeReason(data.error || "Rapid rate limit triggered. Please solve the security verification.");
          setShowSecurityChallenge(true);
        }
        throw new Error(data.error || "Failed to dispatch SMS through Twilio Gateway");
      }

      setDispatchResult({
        success: true,
        id: data.messageId || data.providerMessageId,
        e164: data.recipientPhone,
        recipientFormatted: phoneResult.international,
        segments: data.segments,
        cost: data.costEstimate.toFixed(4),
        timestamp: "Just now",
        isSimulated: data.isSimulated,
        warning: data.warning,
      });

      // Clear input
      setMessageText("");
      setConsentConfirmed(false);
    } catch (err: any) {
      console.error("SMS Transmission error:", err);
      setApiError(err.message || "Failed to dispatch message. Please check logs.");
    } finally {
      setIsSending(false);
      setShowConfirmModal(false);
    }
  };

  const handleResetForm = () => {
    setDispatchResult(null);
    setApiError(null);
    setMessageText("");
    setConsentConfirmed(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Compose & Send SMS
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Deliver international transactional messages with automatic E.164 normalization, segment calculations, and consent tracking.
          </p>
        </div>

        {/* Carrier status badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="pill" className="text-xs py-1 px-3 gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Twilio Direct Carrier Interconnect Active</span>
          </Badge>
        </div>
      </div>

      {/* Dispatch Success Alert Banner */}
      {dispatchResult && (
        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm animate-in fade-in-50 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-sm font-bold block">
                  SMS Message Successfully Queued & Transmitted!
                </span>
                <p className="text-xs leading-relaxed">
                  Dispatched to <span className="font-semibold text-foreground">{dispatchResult.recipientFormatted}</span> ({dispatchResult.e164}) via Tier-1 carrier routes. Handset delivery receipt will be recorded in Message History.
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-muted-foreground pt-1">
                  <span>Tracking SID: {dispatchResult.id}</span>
                  <span>•</span>
                  <span>{dispatchResult.segments} {dispatchResult.segments === 1 ? "Segment" : "Segments"} (~${dispatchResult.cost} USD)</span>
                  <span>•</span>
                  <span>{dispatchResult.timestamp}</span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetForm}
              className="text-xs shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Send Another
            </Button>
          </div>
        </div>
      )}

      {/* API Error Alert Banner */}
      {apiError && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-3 animate-in fade-in-50">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Transmission Blocked / Failed</span>
            <p className="leading-relaxed">{apiError}</p>
          </div>
        </div>
      )}

      {/* Mobile Switcher (Compose vs Preview) */}
      <div className="lg:hidden flex items-center bg-muted/60 p-1 rounded-xl border border-border/80 text-xs">
        <button
          type="button"
          onClick={() => setMobileTab("compose")}
          className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
            mobileTab === "compose"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground"
          }`}
        >
          Message Composer
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "preview"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Handset Preview</span>
        </button>
      </div>

      {/* Main Grid: Left = Composer, Right = Smartphone Handset Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Composer Form */}
        <div
          className={`lg:col-span-7 space-y-6 ${
            mobileTab === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          <form onSubmit={handleOpenReview} className="space-y-6">
            <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-sm space-y-6">
              
              {/* 1. Recipient Phone Number & Country Selector */}
              <div className="space-y-2">
                <PhoneInput
                  label="1. Recipient International Phone Number"
                  required
                  defaultCountryCode="IN"
                  onChange={(res) => setPhoneResult(res)}
                  onCountryChange={(c) => setSelectedCountry(c)}
                  showValidationMessage={true}
                />
                <p className="text-[11px] text-muted-foreground">
                  Supports instant search across 180+ countries (India +91, USA +1, UK +44, Canada +1, Australia +61, Germany +49, Japan +81, etc.).
                </p>
              </div>

              {/* Quick Canned Templates */}
              <div className="space-y-2 pt-1 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Quick Canned Templates
                  </span>
                  <span className="text-[11px] text-muted-foreground">Click to populate</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cannedTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMessageText(template.text)}
                      className="p-2.5 rounded-xl bg-muted/40 hover:bg-muted/80 border border-border/60 text-left transition-colors group space-y-0.5"
                    >
                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                        {template.title}
                      </span>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {template.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Message Textarea */}
              <div className="space-y-2 pt-1 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="message-textarea"
                    className="text-xs font-semibold text-foreground"
                  >
                    2. Message Content <span className="text-destructive">*</span>
                  </label>
                  <span
                    className={`text-xs font-mono font-medium ${
                      metrics.charsRemainingInSegment <= 10 && metrics.charsRemainingInSegment >= 0
                        ? "text-amber-500 font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {metrics.charCount} characters • {metrics.charsRemainingInSegment} remaining in segment
                  </span>
                </div>

                <textarea
                  id="message-textarea"
                  rows={5}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message here... E.g., Your appointment is confirmed for tomorrow at 10:00 AM."
                  className="w-full rounded-2xl bg-background border border-border/80 p-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed font-sans resize-y min-h-[120px]"
                />

                {/* 3. Character Counter & SMS Segment Estimator Details */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      Segment Estimation
                    </span>
                    <Badge
                      variant={metrics.encoding === "GSM-7" ? "pill" : "outline"}
                      className="text-[10px] font-mono font-bold"
                    >
                      Encoding: {metrics.encoding}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-xl bg-background border border-border/60">
                      <span className="text-[10px] text-muted-foreground block">Total Length</span>
                      <span className="font-mono font-bold text-foreground">
                        {metrics.charCount} chars
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-background border border-border/60">
                      <span className="text-[10px] text-muted-foreground block">Billable Segments</span>
                      <span className="font-mono font-bold text-primary">
                        {metrics.segmentCount} {metrics.segmentCount === 1 ? "Segment" : "Segments"}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-background border border-border/60 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-muted-foreground block">Estimated Cost</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ~${metrics.estimatedCostUsd} USD
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground pt-1">
                    {metrics.encoding === "GSM-7"
                      ? "Standard GSM-7 encoding (160 characters per single message; 153 chars per concatenated segment)."
                      : "UCS-2 / Unicode encoding detected (70 characters per single message; 67 chars per concatenated segment)."}
                  </p>
                </div>
              </div>

              {/* 4. Messaging Consent Confirmation */}
              <div className="pt-2 border-t border-border/60 space-y-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  3. Recipient Consent Verification
                </span>
                <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500/30 h-4 w-4"
                  />
                  <div className="text-xs text-foreground/90 space-y-0.5 leading-snug">
                    <span className="font-semibold block text-foreground">
                      I confirm recipient opt-in consent
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      I certify that this recipient has explicitly agreed to receive transactional SMS messages from my organization in compliance with TCPA and GDPR rules, and unsubscribe keywords (STOP) are supported.
                    </p>
                  </div>
                </label>
              </div>

              {/* 5. Clear Delivery Disclaimer Warning */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-0.5">
                  <span className="font-bold">Delivery Disclaimer Notice:</span>
                  <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                    ReachOut guarantees tier-1 carrier handshakes, but cannot guarantee successful handset delivery to phone numbers that are blocked, inactive, registered under national Do Not Disturb (DND) registries, or designated as fixed landlines.
                  </p>
                </div>
              </div>

            </div>

            {/* Submit Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-sm">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                <span>Requires valid E.164 number, non-empty message & consent.</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button variant="outline" type="button" className="w-full text-xs">
                    Cancel
                  </Button>
                </Link>

                <Button
                  type="submit"
                  variant="glow"
                  disabled={!canProceed}
                  className="w-full sm:w-auto text-xs font-semibold gap-2 shadow-lg min-w-[170px]"
                >
                  <span>Review & Send SMS</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Live Message Preview Handset */}
        <div
          className={`lg:col-span-5 space-y-4 ${
            mobileTab === "compose" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-foreground">
                Live Handset Preview
              </h2>
              <p className="text-xs text-muted-foreground">
                Real-time visual simulation of the recipient&apos;s phone.
              </p>
            </div>
            <span className="text-[11px] font-mono text-primary font-semibold">
              Instant Sync
            </span>
          </div>

          <LiveMessagePreview
            messageText={messageText}
            phoneResult={phoneResult}
            selectedCountry={selectedCountry}
            metrics={metrics}
          />
        </div>

      </div>

      {/* Confirmation Review Modal */}
      {phoneResult && (
        <SendConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmSend}
          isSending={isSending}
          phoneResult={phoneResult}
          messageText={messageText}
          metrics={metrics}
        />
      )}

      {/* Interactive Security Challenge Modal (Phase 10) */}
      <SecurityChallengeModal
        isOpen={showSecurityChallenge}
        onClose={() => setShowSecurityChallenge(false)}
        onVerified={() => {
          setApiError(null);
          // Auto-trigger confirm send once verified
          handleConfirmSend();
        }}
        triggerReason={challengeReason}
      />
    </div>
  );
}
