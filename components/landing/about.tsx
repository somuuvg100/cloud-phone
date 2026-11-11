"use client";

import * as React from "react";
import { ShieldCheck, HeartHandshake, Globe, Award, Sparkles, Building2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function About() {
  const stats = [
    { label: "Supported Destinations", value: "180+", sub: "Direct Tier 1 Carrier Links" },
    { label: "Global Deliverability", value: "99.98%", sub: "Industry-leading routing" },
    { label: "Median Delivery Time", value: "1.2s", sub: "End-to-end receipt latency" },
    { label: "Consent Compliance", value: "100%", sub: "TCPA & GDPR automated logs" },
  ];

  return (
    <section id="about" className="py-24 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="pill" className="px-3 py-1 text-xs uppercase tracking-wider font-semibold">
              About ReachOut
            </Badge>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Bridging Distances with Respect, Speed, and Certainty.
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              ReachOut was created to address a critical blind spot in modern communication: the friction and unreliability of cross-border SMS. While the internet is borderless, telecommunication carriers remain fragmented.
            </p>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              We engineered a unified platform combining intelligent international number normalization, direct Twilio carrier pipes, and automated consent enforcement. Whether you are confirming a hospital appointment in Tokyo, authenticating a user in Berlin, or updating a client in New York, ReachOut guarantees your message arrives respectfully and reliably.
            </p>

            <div className="space-y-3 pt-2">
              {[
                "Consent-first delivery pipeline preventing spam and carrier penalties",
                "Built on modern Next.js 15, TypeScript, Supabase, and Twilio infrastructure",
                "Full audit logs with timestamps, carrier delivery receipts, and recipient consent tokens",
              ].map((point, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Metrics Grid */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-cyan-500/5 border border-border/80 shadow-lg">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 space-y-1 hover:border-primary/40 transition-colors"
                >
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-mono text-primary">
                    {stat.value}
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    {stat.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {stat.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

