"use client";

import * as React from "react";
import { LucideIcon, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertTriangle, Send, Zap } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  changeLabel?: string;
  subtext?: string;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "destructive" | "amber";
  progressPercent?: number;
}

export function StatCard({
  title,
  value,
  changeLabel,
  subtext,
  icon: Icon,
  variant = "primary",
  progressPercent,
}: StatCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          iconWrap: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          bar: "bg-emerald-500",
        };
      case "warning":
        return {
          iconWrap: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          bar: "bg-amber-500",
        };
      case "destructive":
        return {
          iconWrap: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          pill: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
          bar: "bg-rose-500",
        };
      case "amber":
        return {
          iconWrap: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
          pill: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
          bar: "bg-gradient-to-r from-blue-500 to-indigo-600",
        };
      case "primary":
      default:
        return {
          iconWrap: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          bar: "bg-blue-600",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-border hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3 group">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground tracking-tight">
          {title}
        </span>
        <div
          className={`p-2.5 rounded-xl border ${styles.iconWrap} group-hover:scale-105 transition-transform duration-200`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Main Stat Value */}
      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>

        {/* Change or subtext */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {changeLabel && (
            <span
              className={`px-1.5 py-0.5 rounded-md font-semibold ${styles.pill}`}
            >
              {changeLabel}
            </span>
          )}
          {subtext && (
            <span className="text-muted-foreground truncate">{subtext}</span>
          )}
        </div>
      </div>

      {/* Optional Progress Bar */}
      {typeof progressPercent === "number" && (
        <div className="pt-1">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${styles.bar} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

