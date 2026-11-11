"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  History,
  CheckCircle2,
  Settings,
  HelpCircle,
  LogOut,
  MessageSquareShare,
  X,
  Zap,
  ShieldCheck,
  ChevronRight,
  Globe2,
  MessageSquare,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MOCK_STATS } from "@/lib/mock-data";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  userEmail?: string;
  userName?: string;
}

export function DashboardSidebar({
  mobileOpen = false,
  onCloseMobile,
  userEmail = "user@reachout.global",
  userName = "ReachOut Member",
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Virtual Numbers",
      href: "/dashboard/numbers",
      icon: Globe2,
      badge: "Blacktel",
    },
    {
      label: "2-Way SMS Inbox",
      href: "/dashboard/inbox",
      icon: MessageSquare,
      badge: "Live",
    },
    {
      label: "Webphone & Calls",
      href: "/dashboard/calls",
      icon: PhoneCall,
    },
    {
      label: "Send Message",
      href: "/dashboard/send",
      icon: Send,
    },
    {
      label: "Message History",
      href: "/dashboard/history",
      icon: History,
    },
    {
      label: "Profile Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
      label: "Help & Support",
      href: "/dashboard/support",
      icon: HelpCircle,
    },
  ];

  const allowance = MOCK_STATS.dailyAllowance;
  const percentage = Math.round((allowance.used / allowance.total) * 100);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border/80 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-border/60">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
            <MessageSquareShare className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 border border-card"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-foreground">
                ReachOut
              </span>
              <Badge variant="pill" className="text-[9px] px-1.5 py-0 font-bold uppercase">
                Pro
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground block -mt-0.5">
              Global Messaging
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Platform Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && !isActive && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Logout Item (Item 7) */}
        <div className="pt-2">
          <Link
            href="/logout"
            onClick={onCloseMobile}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors group"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Logout</span>
          </Link>
        </div>
      </div>

      {/* Daily Message Allowance Card in Sidebar Footer */}
      <div className="p-3 border-t border-border/60">
        <div className="p-3 rounded-xl bg-muted/50 border border-border/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Daily Allowance
            </span>
            <span className="text-[11px] font-mono font-bold text-foreground">
              {allowance.remaining} left
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/60">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{allowance.used} sent today</span>
            <span>Limit: {allowance.total}</span>
          </div>
        </div>

        {/* User Mini Card */}
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-foreground truncate">
                {userName}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {userEmail}
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
            title="Settings"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 z-30 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sliding Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

