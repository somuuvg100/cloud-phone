"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquareShare, Globe, Shield, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-background/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <Link href="#home" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20">
                <MessageSquareShare className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                ReachOut
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Global messaging platform engineered for simple, reliable, and consent-based international SMS delivery.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All global carrier routes operational</span>
            </div>
          </div>

          {/* Links Column 1: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Product
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Global SMS Gateway</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Phone Number Validation</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Consent Manager</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Delivery Telemetry</a></li>
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Carrier Status Page</a></li>
            </ul>
          </div>

          {/* Links Column 2: Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Tech Stack
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>Next.js 15 App Router</li>
              <li>Supabase PostgreSQL & Auth</li>
              <li>Twilio Tier-1 Gateway</li>
              <li>libphonenumber-js</li>
              <li>Tailwind CSS & shadcn/ui</li>
            </ul>
          </div>

          {/* Links Column 3: Trust & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Trust & Security
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>TCPA & CTIA Guidelines</li>
              <li>GDPR Privacy Standard</li>
              <li>Opt-in & Opt-out Tracking</li>
              <li>Security & Row-Level Policies</li>
              <li>Terms of Service & Privacy</li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} ReachOut – Global Messaging Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Built with Next.js 15 & Tailwind CSS
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}

