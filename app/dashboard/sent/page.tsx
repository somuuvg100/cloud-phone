"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Zap, ArrowRight, Send } from "lucide-react";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { MOCK_RECENT_ACTIVITY } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function SentMessagesPage() {
  const sentOnly = MOCK_RECENT_ACTIVITY.filter((m) => m.status === "delivered");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Sent Messages
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Confirmed international transmissions with positive carrier handshakes and handset receipts.
          </p>
        </div>

        <Link href="/dashboard/send">
          <Button variant="glow" size="sm" className="text-xs gap-1.5">
            <Send className="w-3.5 h-3.5" />
            <span>Send Message</span>
          </Button>
        </Link>
      </div>

      {/* SLA Metrics Pill Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-muted-foreground">Handset Receipts</span>
            <div className="text-lg font-bold font-mono text-emerald-500">18,124</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-muted-foreground">Median Carrier Latency</span>
            <div className="text-lg font-bold font-mono text-foreground">1.18s</div>
          </div>
          <Zap className="w-5 h-5 text-amber-500" />
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-muted-foreground">SLA Deliverability</span>
            <div className="text-lg font-bold font-mono text-blue-500">99.8%</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-blue-500" />
        </div>
      </div>

      <RecentActivity
        messages={sentOnly}
        title="Delivered Messages"
        showViewAll={false}
      />
    </div>
  );
}

