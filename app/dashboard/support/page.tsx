"use client";

import * as React from "react";
import {
  HelpCircle,
  MessageSquare,
  FileText,
  Mail,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HelpSupportPage() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  const faqs = [
    {
      q: "How does ReachOut validate international phone numbers?",
      a: "ReachOut uses the libphonenumber-js engine to parse, format, and validate phone numbers into international E.164 syntax with real-time country detection and carrier type checking.",
    },
    {
      q: "What causes an SMS delivery to fail?",
      a: "The most common causes are invalid phone numbers (such as landlines attempting to receive SMS), unregistered sender IDs in specific countries, or recipient carrier filtering. ReachOut provides detailed delivery receipt error codes for every transmission.",
    },
    {
      q: "What are the opt-in consent requirements?",
      a: "Under TCPA, CTIA, and GDPR regulations, recipients must provide verifiable opt-in consent before receiving transactional or marketing messages. All messages must support standard opt-out keywords like STOP, CANCEL, or UNSUBSCRIBE.",
    },
    {
      q: "What is the daily message allowance?",
      a: "Every new ReachOut account starts with a 1,000 message daily allowance on Tier-1 carrier routes. Once verified, you can upgrade to unlimited throughput directly from your billing settings.",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Help & Support Center
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Find answers, check international carrier status, or connect with our telecom engineering support team.
        </p>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Documentation</h3>
          <p className="text-xs text-muted-foreground">
            Explore API routes, webhooks, and phone formatting guides.
          </p>
          <div className="pt-2">
            <a href="#" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span>Read Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Compliance Guide</h3>
          <p className="text-xs text-muted-foreground">
            Best practices for TCPA, GDPR, and opt-in consent logs.
          </p>
          <div className="pt-2">
            <a href="#" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span>View Guide</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Mail className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Direct Support</h3>
          <p className="text-xs text-muted-foreground">
            24/7 telecom support with under 15-minute response SLA.
          </p>
          <div className="pt-2">
            <a href="mailto:support@reachout.global" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span>Email Support</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-foreground">
          Frequently Asked Questions
        </h2>

        <div className="divide-y divide-border/60">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-3">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-foreground py-1 group"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                    openFaq === idx ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed animate-in fade-in-50">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

