"use client";

import * as React from "react";
import {
  Globe2,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
  CheckCircle,
  FileText,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Features() {
  const featureList = [
    {
      icon: Globe2,
      badge: "Global Reach",
      title: "Smart Country Code & E.164 Validation",
      description:
        "Effortlessly parse, sanitize, and validate phone numbers from 180+ countries in real-time using libphonenumber-js with automatic flag detection.",
      accent: "from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      icon: ShieldCheck,
      badge: "Compliance",
      title: "Consent-Driven Opt-In Protection",
      description:
        "Every message requires verified recipient consent, ensuring full compliance with TCPA, GDPR, and regional telecommunication mandates.",
      accent: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      icon: Zap,
      badge: "High Velocity",
      title: "Tier-1 Twilio Carrier Infrastructure",
      description:
        "Direct telco interconnects deliver ultra-low latency SMS dispatch with intelligent failover and carrier retry queues.",
      accent: "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    {
      icon: Activity,
      badge: "Live Telemetry",
      title: "End-to-End Delivery Tracking",
      description:
        "Monitor SMS life-cycle in real-time from queued, dispatched, carrier-acknowledged, to confirmed handset delivery.",
      accent: "from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
    {
      icon: Lock,
      badge: "Secure Storage",
      title: "Supabase PostgreSQL & Auth",
      description:
        "Enterprise-grade row level security (RLS), encrypted credential storage, and seamless OAuth/magic-link authentication.",
      accent: "from-sky-500/10 to-cyan-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    },
    {
      icon: Layers,
      badge: "Modern Stack",
      title: "Next.js 15 & Server-Driven Architecture",
      description:
        "Engineered with React 19, Next.js App Router, Tailwind CSS, and shadcn/ui for optimal Core Web Vitals and lightning speed.",
      accent: "from-rose-500/10 to-red-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="pill" className="px-3 py-1 text-xs uppercase tracking-wider font-semibold">
            Built for Global Scale
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Everything You Need for Dependable Cross-Border SMS
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            From single transactional alerts to mission-critical notifications, ReachOut combines telecom power with an intuitive, clean interface.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureList.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className="group relative border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-2xl overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${item.accent} border group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/60">
                      {item.badge}
                    </span>
                  </div>

                  <CardTitle className="text-xl font-bold tracking-tight text-foreground pt-2">
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
}

