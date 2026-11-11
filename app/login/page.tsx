"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (!isSupabaseConfigured()) {
        // Mock fallback mode for preview if Supabase keys are pending
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSuccessMessage("Authentication successful! Redirecting to dashboard...");
        setTimeout(() => {
          router.push(redirectTarget);
        }, 1000);
        return;
      }

      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw authError;
      }

      setSuccessMessage("Welcome back! Redirecting...");
      router.push(redirectTarget);
      router.refresh();
    } catch (err: any) {
      if (err.message?.toLowerCase().includes("email not confirmed")) {
        setErrorMessage(
          `Email not confirmed: Supabase sent a verification email to ${data.email}. Please click the confirmation link in your inbox (or spam folder), or confirm your user in the Supabase Dashboard.`
        );
      } else if (err.message === "Invalid login credentials") {
        setErrorMessage("Invalid email or password. Please try again.");
      } else {
        setErrorMessage(err.message || "Failed to sign in. Please verify your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-foreground">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
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
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              {...register("rememberMe")}
              type="checkbox"
              disabled={isLoading}
              className="rounded border-border text-primary focus:ring-primary/30 h-4 w-4"
            />
            <span className="text-muted-foreground">Keep me signed in for 30 days</span>
          </label>
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
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your ReachOut dashboard to manage messaging and contacts."
      footer={
        <p className="text-xs text-muted-foreground">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Create one free
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
        <LoginForm />
      </React.Suspense>
    </AuthCard>
  );
}
