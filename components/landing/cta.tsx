"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-8 sm:p-12 lg:p-16 text-white shadow-2xl">
          {/* Subtle decorative background circles */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Ready for Modern International Messaging?</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Start Connecting Across Borders in Minutes
            </h2>

            <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Experience the power of simple, reliable, consent-based international SMS. Join thousands of teams delivering trusted messages worldwide.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full bg-white text-blue-700 hover:bg-slate-100 font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  Explore Features
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 pt-4 text-xs text-blue-100/80">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                No Credit Card Required
              </span>
              <span>•</span>
              <span>Free Test Sandbox Credits</span>
              <span>•</span>
              <span>Instant Setup</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

