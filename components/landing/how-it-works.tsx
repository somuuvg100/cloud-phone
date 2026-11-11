"use client";

import * as React from "react";
import { CheckCircle2, Send, PhoneCall, ShieldCheck, ArrowRight, Activity, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Select Country & Validate Number",
      description:
        "Choose from 180+ supported countries. Our libphonenumber-js engine automatically formats the recipient's phone number into valid E.164 syntax and detects carrier suitability.",
      tag: "Instant Format",
    },
    {
      step: "02",
      title: "Verify Recipient Consent & Compose",
      description:
        "Draft your SMS with automatic character counting and GSM-7 / UCS-2 segment calculations. Verify opt-in consent to ensure complete TCPA compliance and avoid carrier spam filters.",
      tag: "Consent Safe",
    },
    {
      step: "03",
      title: "Transmit via Twilio & Track Handset Delivery",
      description:
        "Dispatch through direct Tier-1 carrier routes. Receive real-time webhooks updating delivery state from 'queued' to 'carrier received' to 'handset delivered' with precision timestamps.",
      tag: "Live Receipts",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-muted/30 border-y border-border/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <Badge variant="pill" className="px-3 py-1 text-xs uppercase tracking-wider font-semibold">
            Seamless Workflow
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            How ReachOut Works
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Designed for developers, operations teams, and businesses who need guaranteed delivery without telecom complexity.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="relative p-8 rounded-2xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              {/* Step indicator number */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-4xl font-extrabold tracking-tighter text-primary/20 dark:text-primary/30 font-mono">
                  {item.step}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {item.tag}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-border/60 flex items-center text-xs font-medium text-primary">
                <span>Step {index + 1} of 3</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

