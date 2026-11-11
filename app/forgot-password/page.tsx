"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, CheckCircle2, Mail, ArrowRight } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (!isSupabaseConfigured()) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSubmittedEmail(data.email);
        setIsSuccess(true);
        return;
      }

      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send reset link. Please check your email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your verified account email and we'll send you a secure password reset link."
      footer={
        <p className="text-xs text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Back to Sign in
          </Link>
        </p>
      }
    >
      {/* Alert Banner */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="text-center space-y-4 py-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Mail className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">
              Check your inbox
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              We&apos;ve sent a password reset link to{" "}
              <span className="font-semibold text-foreground">{submittedEmail}</span>. Please click the link in that email to proceed.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSuccess(false)}
              className="text-xs"
            >
              Didn&apos;t receive it? Try another email
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Email Address
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="sarah@company.com"
              disabled={isLoading}
              className={`w-full rounded-xl bg-background border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? "border-destructive focus:ring-destructive/30"
                  : "border-border/80 focus:ring-primary/30"
              }`}
            />
            {errors.email && (
              <p className="text-[11px] text-destructive mt-1 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="glow"
              disabled={isLoading}
              className="w-full h-11 text-sm font-semibold rounded-xl gap-2 shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </AuthCard>
  );
}

