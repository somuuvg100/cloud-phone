"use client";

import * as React from "react";
import { BarChart3, TrendingUp, Calendar, Info } from "lucide-react";
import { DailyVolumeData } from "@/types/dashboard";

interface DeliveryChartProps {
  data: DailyVolumeData[];
}

export function DeliveryChart({ data }: DeliveryChartProps) {
  const [hoveredDay, setHoveredDay] = React.useState<DailyVolumeData | null>(null);

  const maxTotal = Math.max(...data.map((d) => d.total), 3500);

  return (
    <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-6">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">
              7-Day Delivery Volume & Success Rate
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              +14.8% SLA
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Daily throughput across all Tier-1 carrier routes.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="text-muted-foreground text-[11px]">Delivered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            <span className="text-muted-foreground text-[11px]">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span className="text-muted-foreground text-[11px]">Failed</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="pt-4">
        <div className="h-48 w-full flex items-end justify-between gap-2 sm:gap-4 px-2">
          {data.map((item) => {
            const heightPercent = Math.round((item.total / maxTotal) * 100);
            const isHovered = hoveredDay?.day === item.day;

            return (
              <div
                key={item.day}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredDay(item)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-16 z-30 bg-popover text-popover-foreground border border-border px-3 py-1.5 rounded-xl shadow-xl text-[11px] whitespace-nowrap animate-in fade-in-50 zoom-in-95 pointer-events-none">
                    <div className="font-bold text-foreground">
                      {item.day} ({item.date}): {item.total.toLocaleString()} total
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span className="text-emerald-500 font-medium">✓ {item.delivered} delivered</span>
                      <span className="text-amber-500 font-medium">⏳ {item.pending}</span>
                      {item.failed > 0 && <span className="text-rose-500 font-medium">✕ {item.failed}</span>}
                    </div>
                  </div>
                )}

                {/* Vertical Bar */}
                <div
                  className="w-full max-w-[48px] rounded-t-xl overflow-hidden transition-all duration-300 flex flex-col justify-end relative shadow-sm"
                  style={{ height: `${heightPercent}%` }}
                >
                  {/* Delivered Portion */}
                  <div
                    className={`w-full bg-gradient-to-t from-blue-600 to-indigo-500 transition-all ${
                      isHovered ? "brightness-110" : "opacity-90"
                    }`}
                    style={{
                      height: `${(item.delivered / item.total) * 100}%`,
                    }}
                  />
                  {/* Pending portion */}
                  {item.pending > 0 && (
                    <div
                      className="w-full bg-amber-400"
                      style={{
                        height: `${(item.pending / item.total) * 100}%`,
                      }}
                    />
                  )}
                  {/* Failed portion */}
                  {item.failed > 0 && (
                    <div
                      className="w-full bg-rose-500"
                      style={{
                        height: `${(item.failed / item.total) * 100}%`,
                      }}
                    />
                  )}
                </div>

                {/* Day Label */}
                <div className="text-center">
                  <div className={`text-xs font-semibold ${isHovered ? "text-primary" : "text-foreground"}`}>
                    {item.day}
                  </div>
                  <div className="text-[10px] text-muted-foreground hidden sm:block">
                    {item.date.split(" ")[1]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>Real-time Twilio carrier webhook synchronization enabled.</span>
        </div>
        <span className="font-semibold text-foreground">
          Average Handset Latency: 1.18s
        </span>
      </div>
    </div>
  );
}

