"use client";

import * as React from "react";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Globe2,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Sparkles,
  PhoneCall,
  MessageSquare,
  Key,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { DeliveryChart } from "@/components/dashboard/delivery-chart";
import { CountryDistribution } from "@/components/dashboard/country-distribution";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MOCK_STATS,
  MOCK_DAILY_VOLUME,
  MOCK_COUNTRY_VOLUME,
  MOCK_RECENT_ACTIVITY,
} from "@/lib/mock-data";

export default function DashboardOverviewPage() {
  const stats = MOCK_STATS;
  const deliveryRate = ((stats.delivered / stats.totalSent) * 100).toFixed(2);
  const failureRate = ((stats.failed / stats.totalSent) * 100).toFixed(2);
  const allowancePercent = Math.round(
    (stats.dailyAllowance.used / stats.dailyAllowance.total) * 100
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white p-6 sm:p-8 shadow-xl overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              <span>Twilio Global Gateway Interconnect • 180+ Countries Online</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              One Message. A World of Reach.
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Your international SMS platform is running at 99.8% handset delivery SLA. All consent audit logs and carrier webhooks are active.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard/send">
              <Button
                size="sm"
                className="bg-white text-blue-700 hover:bg-slate-100 font-bold text-xs gap-1.5 shadow-lg"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send New SMS</span>
              </Button>
            </Link>
            <Link href="/dashboard/numbers">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs font-medium gap-1.5"
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Virtual Numbers</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Blacktel.io Virtual Telecommunications Suite Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Virtual Numbers Store */}
        <Link
          href="/dashboard/numbers"
          className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm hover:border-primary/50 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Globe2 className="w-5 h-5" />
              </div>
              <Badge variant="pill" className="text-[10px] font-bold">25+ Countries</Badge>
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Virtual Numbers Marketplace
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Rent global numbers from US, UK, Canada, Germany & more. Choose Mobile, WhatsApp SIM, or Trash SIM lines.
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
            <span>Browse Numbers</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: 2-Way SMS Messenger & OTPs */}
        <Link
          href="/dashboard/inbox"
          className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm hover:border-primary/50 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <Badge variant="pill" className="text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border-indigo-500/20">2-Way Chat</Badge>
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                SMS Messenger & OTP Inbox
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Receive incoming SMS and 2FA verification codes live. Built-in instant OTP copy button and SMS forwarding.
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
            <span>Open Messenger</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: In-Browser Webphone */}
        <Link
          href="/dashboard/calls"
          className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm hover:border-primary/50 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <PhoneCall className="w-5 h-5" />
              </div>
              <Badge variant="pill" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                Webphone
              </Badge>
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Browser Dialpad & Calls
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Make calls straight from your browser with DTMF touch tones, call recording playback, and custom caller ID.
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
            <span>Launch Webphone</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 5 Core Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Messages Sent */}
        <StatCard
          title="Total Messages Sent"
          value={stats.totalSent}
          changeLabel="+14.2%"
          subtext="vs last 30 days"
          icon={Send}
          variant="primary"
        />

        {/* 2. Successfully Delivered Messages */}
        <StatCard
          title="Successfully Delivered"
          value={stats.delivered}
          changeLabel={`${deliveryRate}% SLA`}
          subtext="handset confirmed"
          icon={CheckCircle2}
          variant="success"
        />

        {/* 3. Pending Messages */}
        <StatCard
          title="Pending Messages"
          value={stats.pending}
          changeLabel="In Transit"
          subtext="queued by carriers"
          icon={Clock}
          variant="warning"
        />

        {/* 4. Failed Messages */}
        <StatCard
          title="Failed Messages"
          value={stats.failed}
          changeLabel={`${failureRate}% rate`}
          subtext="invalid / landline"
          icon={AlertTriangle}
          variant="destructive"
        />

        {/* 5. Remaining Daily Message Allowance */}
        <StatCard
          title="Daily Allowance Left"
          value={`${stats.dailyAllowance.remaining} msgs`}
          changeLabel={`${allowancePercent}% used`}
          subtext={`limit: ${stats.dailyAllowance.total}/day`}
          icon={Zap}
          variant="amber"
          progressPercent={allowancePercent}
        />
      </div>

      {/* Charts & Geographic Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Delivery Analytics Chart (8 cols on large screens) */}
        <div className="lg:col-span-8">
          <DeliveryChart data={MOCK_DAILY_VOLUME} />
        </div>

        {/* Country Distribution (4 cols on large screens) */}
        <div className="lg:col-span-4">
          <CountryDistribution data={MOCK_COUNTRY_VOLUME} />
        </div>
      </div>

      {/* Recent Activity Section */}
      <RecentActivity messages={MOCK_RECENT_ACTIVITY} />
    </div>
  );
}
