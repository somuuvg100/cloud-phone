"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquareShare, ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-grid-pattern hero-gradient relative">
      {/* Top Bar with Back to Home & Theme Toggle */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg bg-card/60 backdrop-blur-md border border-border/60 hover:bg-muted/80 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mt-8 sm:mt-0">
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <Link href="/" className="group flex items-center justify-center">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
              <MessageSquareShare className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400 border-2 border-background"></span>
              </span>
            </div>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-2xl shadow-xl shadow-black/5 p-6 sm:p-8">
          {children}

          {footer && <div className="mt-6 pt-6 border-t border-border/60 text-center">{footer}</div>}
        </div>

        {/* Security & Compliance Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Protected with 256-bit encryption & Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}

