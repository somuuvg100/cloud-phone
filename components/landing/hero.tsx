"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Globe2,
  Sparkles,
  Zap,
  CheckCircle2,
  Radio,
  BarChart3,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneMockup } from "./phone-mockup";

export function Hero() {
  return (
    <section
      id="home"
      className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-grid-pattern hero-gradient"
    >
      {/* Background radial spotlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Subtitle, Value Props, & CTA Buttons */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            
            {/* Pill Announcement */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold backdrop-blur-md shadow-sm animate-pulseGlow">
              <span className="flex h-2 w-2 rounded-full bg-blue-500" />
              <span>Next-Gen Global SMS Infrastructure</span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                Twilio Tier-1 Routing
                <ArrowRight className="w-3 h-3 text-blue-500" />
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              One Message.{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                A World of Possibilities.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted-foreground font-normal max-w-2xl leading-relaxed">
              Connect across borders through simple, reliable, consent-based messaging.
              Deliver critical SMS alerts, OTPs, and relationship-building updates to 180+ countries with verified carrier delivery and real-time tracking.
            </p>

            {/* Micro Highlights / Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg pt-2 text-left">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/80">
                <Globe2 className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs font-medium text-foreground">180+ Countries</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/80">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-medium text-foreground">Opt-in Consent</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/80 col-span-2 sm:col-span-1">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-medium text-foreground">99.98% Deliverability</span>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  variant="glow"
                  size="lg"
                  className="w-full sm:w-auto group gap-2 text-base shadow-xl"
                >
                  <span>Start Messaging Free</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <Link href="#features" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto gap-2 text-base bg-background/60 backdrop-blur-sm hover:bg-muted/80"
                >
                  <Radio className="w-4 h-4 text-blue-500" />
                  <span>Explore Features</span>
                </Button>
              </Link>
            </div>

            {/* Social Proof Stats */}
            <div className="pt-6 border-t border-border/60 w-full flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-10 text-muted-foreground text-xs font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Zero setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Instant API & Web Portal</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Full TCPA & GDPR Audit Log</span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Phone Preview */}
          <div className="lg:col-span-5 flex justify-center items-center relative">
            <PhoneMockup />
          </div>

        </div>
      </div>
    </section>
  );
}

