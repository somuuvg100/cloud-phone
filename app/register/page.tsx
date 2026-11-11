"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (!isSupabaseConfigured()) {
        // Mock fallback mode if credentials haven't been pasted yet
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSuccessMessage("Account created successfully! Redirecting to email verification...");
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        }, 1500);
        return;
      }

      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user && !authData.session) {
        // Confirmation email sent
        setSuccessMessage("Account created! We've sent a verification email to your address.");
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        }, 1200);
      } else {
        // Direct sign-in (if confirm email is disabled in Supabase)
        setSuccessMessage("Account created successfully! Redirecting to dashboard...");
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join ReachOut to send verified, consent-based international SMS."
      footer={
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Sign in here
          </Link>
        </p>
      }
    >
      {/* Alert Banners */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Full Name
          </label>
          <input
            {...register("fullName")}
            type="text"
            placeholder="Sarah Jenkins"
            disabled={isLoading}
            className={`w-full rounded-xl bg-background border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
              errors.fullName
                ? "border-destructive focus:ring-destructive/30"
                : "border-border/80 focus:ring-primary/30"
            }`}
          />
          {errors.fullName && (
            <p className="text-[11px] text-destructive mt-1 font-medium">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Email Address */}
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

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              disabled={isLoading}
              className={`w-full rounded-xl bg-background border px-3.5 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                errors.password
                  ? "border-destructive focus:ring-destructive/30"
                  : "border-border/80 focus:ring-primary/30"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-destructive mt-1 font-medium">
              {errors.password.message}
            </p>
          )}

          {/* Password Strength Indicator */}
          <PasswordStrength password={passwordValue} />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••••••"
              disabled={isLoading}
              className={`w-full rounded-xl bg-background border px-3.5 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                errors.confirmPassword
                  ? "border-destructive focus:ring-destructive/30"
                  : "border-border/80 focus:ring-primary/30"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[11px] text-destructive mt-1 font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              {...register("acceptTerms")}
              type="checkbox"
              disabled={isLoading}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary/30 h-4 w-4"
            />
            <span className="text-xs text-muted-foreground leading-snug">
              I accept the{" "}
              <a href="#" className="text-primary hover:underline font-medium">
                Terms of Service
              </a>{" "}
              and acknowledge the{" "}
              <a href="#" className="text-primary hover:underline font-medium">
                Consent-Based Messaging Guidelines
              </a>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-[11px] text-destructive mt-1 font-medium">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}

