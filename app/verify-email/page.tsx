"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email address";

  const [isResending, setIsResending] = React.useState(false);
  const [resendStatus, setResendStatus] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleResend = async () => {
    if (!email || email === "your email address") {
      setErrorMessage("Please enter or specify a valid email to resend verification.");
      return;
    }

    setIsResending(true);
    setResendStatus(null);
    setErrorMessage(null);

    try {
      if (!isSupabaseConfigured()) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setResendStatus("A new verification link has been sent to your email!");
        return;
      }

      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setResendStatus("A new verification link has been sent to your email!");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to resend email. Please wait a moment and try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="text-center space-y-5 py-2">
      {/* Animated Mail Icon */}
      <div className="relative mx-auto w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
        <Mail className="w-8 h-8" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">
          Verification link dispatched
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
          We sent an activation link to{" "}
          <span className="font-semibold text-foreground break-all">{email}</span>. Click the link in your email to activate your ReachOut account and access the dashboard.
        </p>
      </div>

      {/* Status Alerts */}
      {resendStatus && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{resendStatus}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="pt-2 flex flex-col gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={handleResend}
          disabled={isResending}
          className="w-full text-xs gap-2"
        >
          {isResending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Resending Link...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resend verification email</span>
            </>
          )}
        </Button>

        <Button
          variant="glow"
          asChild
          className="w-full text-xs font-semibold rounded-xl"
        >
          <Link href="/login" className="flex items-center justify-center gap-2">
            <span>Go to Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Verify your email"
      subtitle="We need to confirm your email before you can dispatch global SMS."
      footer={
        <p className="text-xs text-muted-foreground">
          Need help?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Return to Sign in
          </Link>
        </p>
      }
    >
      <React.Suspense
        fallback={
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        }
      >
        <VerifyEmailContent />
      </React.Suspense>
    </AuthCard>
  );
}
