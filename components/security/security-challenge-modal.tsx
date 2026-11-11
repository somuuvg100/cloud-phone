"use client";

import * as React from "react";
import {
  ShieldCheck,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SecurityChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  triggerReason?: string;
}

export function SecurityChallengeModal({
  isOpen,
  onClose,
  onVerified,
  triggerReason = "Rapid message activity detected. Please complete human verification to continue.",
}: SecurityChallengeModalProps) {
  const [challengeId, setChallengeId] = React.useState<string | null>(null);
  const [prompt, setPrompt] = React.useState<string>("");
  const [token, setToken] = React.useState<string>("");
  const [userAnswer, setUserAnswer] = React.useState("");
  const [loadingChallenge, setLoadingChallenge] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const fetchChallenge = React.useCallback(async () => {
    setLoadingChallenge(true);
    setError(null);
    setUserAnswer("");
    try {
      const res = await fetch("/api/security/challenge");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load verification challenge");
      setChallengeId(data.challengeId);
      setPrompt(data.prompt);
      setToken(data.token);
    } catch (err: any) {
      setError(err.message || "Failed to contact security engine");
    } finally {
      setLoadingChallenge(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      fetchChallenge();
    }
  }, [isOpen, fetchChallenge]);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId || !userAnswer.trim()) return;

    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/security/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          answer: userAnswer.trim(),
          token,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || "Incorrect answer. Please try again.");
      }

      setSuccess(true);
      setTimeout(() => {
        onVerified();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Verification failed");
      // Refresh challenge on error
      fetchChallenge();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-foreground">
                Security Verification
              </h3>
              <p className="text-xs text-muted-foreground">
                Human Activity Challenge
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

        {/* Reason banner */}
        <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{triggerReason}</span>
        </div>

        {/* Challenge form */}
        <form onSubmit={handleVerify} className="mt-4 space-y-4">
          <div className="p-4 bg-muted/50 rounded-xl border border-border/80 text-center space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Solve the equation
            </span>
            {loadingChallenge ? (
              <div className="flex items-center justify-center py-2 gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating verification challenge...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span className="text-lg font-bold font-mono text-foreground tracking-wide">
                  {prompt}
                </span>
                <button
                  type="button"
                  onClick={fetchChallenge}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                  title="New challenge"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Your Answer</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Enter numeric answer..."
              required
              autoFocus
              className="w-full px-3 py-2 text-center text-lg font-mono font-bold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Verification confirmed! Unlocking dispatch...</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isVerifying || !userAnswer.trim() || loadingChallenge}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Verify & Proceed
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

