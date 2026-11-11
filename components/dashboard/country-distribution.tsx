"use client";

import * as React from "react";
import { Globe2, ArrowUpRight } from "lucide-react";
import { CountryVolumeData } from "@/types/dashboard";

interface CountryDistributionProps {
  data: CountryVolumeData[];
}

export function CountryDistribution({ data }: CountryDistributionProps) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-5 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Top Global Destinations
          </h2>
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            180+ Active
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          International delivery volume breakdown by country.
        </p>
      </div>

      <div className="space-y-3.5">
        {data.map((item) => (
          <div key={item.code} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-sm">{item.flag}</span>
                <span className="font-semibold text-foreground truncate max-w-[130px]">
                  {item.country}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {item.avgLatency}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-foreground">
                  {item.count.toLocaleString()}
                </span>
                <span className="text-[11px] text-muted-foreground w-10 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Micro Progress Bar */}
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-primary font-semibold cursor-pointer hover:underline">
        <span>View all destination countries</span>
        <ArrowUpRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

