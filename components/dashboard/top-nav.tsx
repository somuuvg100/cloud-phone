"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  Send,
  Globe2,
  CheckCircle2,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";

interface TopNavProps {
  onOpenMobileSidebar: () => void;
  userName?: string;
  userEmail?: string;
}

export function DashboardTopNav({
  onOpenMobileSidebar,
  userName = "ReachOut Member",
}: TopNavProps) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = React.useState(false);

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Overview";
    if (pathname.startsWith("/dashboard/numbers")) return "Virtual Numbers Store";
    if (pathname.startsWith("/dashboard/inbox")) return "2-Way SMS Messenger & OTPs";
    if (pathname.startsWith("/dashboard/calls")) return "Webphone & Call Logs";
    if (pathname.startsWith("/dashboard/send")) return "Send Message";
    if (pathname.startsWith("/dashboard/history")) return "Message History";
    if (pathname.startsWith("/dashboard/sent")) return "Sent Messages";
    if (pathname.startsWith("/dashboard/settings")) return "Profile Settings";
    if (pathname.startsWith("/dashboard/support")) return "Help & Support";
    return "Dashboard";
  };

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border/80 bg-background/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile Menu Toggle & Breadcrumb Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
            Dashboard
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">/</span>
          <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Center / Search Input (hidden on small mobile) */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages, phone numbers, or countries..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-muted/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Right: Telemetry pill, Notifications, ThemeToggle, Quick Send */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Blacktel Credits Pill */}
        <Link
          href="/dashboard/numbers"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm"
          title="Virtual Numbers & Wallet"
        >
          <span>⚡ 120</span>
          <span className="text-[10px] text-muted-foreground font-normal hidden sm:inline">Credits</span>
        </Link>

        {/* Carrier SLA Status Pill */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Twilio Tier-1 Route Active</span>
        </div>

        {/* Notifications Icon with simulated popover */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative h-9 w-9 rounded-xl hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          </Button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-popover text-popover-foreground border border-border rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-xs font-bold">Recent Notifications</span>
                <span className="text-[10px] text-muted-foreground">3 unread</span>
              </div>
              <div className="py-2 space-y-2.5 text-xs">
                <div className="p-2 rounded-lg bg-muted/50 space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Delivery Spike Complete
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    100% of batch #B-9021 delivered in under 1.2s.
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-500" />
                    Tier-1 Gateway Latency
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Global route latency improved by 14% today.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dark/Light mode toggle */}
        <ThemeToggle />

        {/* Quick Send CTA */}
        <Link href="/dashboard/send">
          <Button
            variant="glow"
            size="sm"
            className="hidden sm:inline-flex rounded-xl text-xs font-semibold gap-1.5 h-9 px-3.5 shadow-md shadow-blue-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send SMS</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}

