"use client";

import * as React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  X,
  CheckCircle2,
  Loader2,
  Ban,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AbuseReportType } from "@/types/database";

interface AbuseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPhone: string;
  evidenceMessageId?: string;
  evidenceText?: string;
  onSuccess?: () => void;
}

export function AbuseReportModal({
  isOpen,
  onClose,
  targetPhone,
  evidenceMessageId,
  evidenceText,
  onSuccess,
}: AbuseReportModalProps) {
  const [reportType, setReportType] = React.useState<AbuseReportType>("unsolicited_spam");
  const [description, setDescription] = React.useState("");
  const [autoSuppress, setAutoSuppress] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a description for the report." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/abuse/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPhone,
          reportType,
          description: description.trim(),
          evidenceMessageId: evidenceMessageId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit abuse report");
      }

      setStatusMessage({
        type: "success",
        text: data.message || "Report filed successfully. Target recipient has been suppressed.",
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2200);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "An error occurred while submitting your report.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                Report Abuse or Unsolicited Message
              </h3>
              <p className="text-xs text-muted-foreground">
                Target Recipient: <span className="font-mono font-medium text-foreground">{targetPhone}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {evidenceText && (
            <div className="p-3 bg-muted/60 border border-border/80 rounded-xl text-xs space-y-1">
              <span className="font-medium text-muted-foreground block uppercase text-[10px] tracking-wider">
                Referenced Message
              </span>
              <p className="line-clamp-2 text-foreground font-mono italic">
                &ldquo;{evidenceText}&rdquo;
              </p>
            </div>
          )}

          {/* Report Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Violation Category</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "unsolicited_spam", label: "Unsolicited Spam" },
                { id: "harassment", label: "Harassment / Threats" },
                { id: "phishing", label: "Phishing / Scam" },
                { id: "spoofing", label: "Spoofing / Fraud" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    reportType === opt.id
                      ? "border-red-500/60 bg-red-500/5 text-foreground font-medium"
                      : "border-border/60 hover:border-border text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={opt.id}
                    checked={reportType === opt.id}
                    onChange={(e) => setReportType(e.target.value as AbuseReportType)}
                    className="accent-red-600"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Incident Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context regarding the unsolicited messaging or harassment incident..."
              rows={3}
              required
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all placeholder:text-muted-foreground"
            />
          </div>

          {/* Automatic Suppression Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/60 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSuppress}
              onChange={(e) => setAutoSuppress(e.target.checked)}
              className="mt-0.5 accent-red-600"
            />
            <div className="text-xs">
              <span className="font-medium text-foreground block">
                Add to Global Suppression List
              </span>
              <span className="text-muted-foreground">
                Immediately block all future outbound SMS dispatches to this number across your account.
              </span>
            </div>
          </label>

          {/* Feedback */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" />
                  Submit Report & Suppress
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

