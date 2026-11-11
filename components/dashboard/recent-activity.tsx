"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { ActivityMessage, DeliveryStatus } from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RecentActivityProps {
  messages: ActivityMessage[];
  title?: string;
  showViewAll?: boolean;
}

export function RecentActivity({
  messages,
  title = "Recent Messaging Activity",
  showViewAll = true,
}: RecentActivityProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [selectedMessage, setSelectedMessage] = React.useState<ActivityMessage | null>(null);

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.maskedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.messagePreview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.country.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || msg.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: DeliveryStatus | string) => {
    switch (status) {
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Delivered</span>
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Sent (Carrier ACK)</span>
          </span>
        );
      case "sending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <RefreshCw className="w-3.5 h-3.5 text-sky-500 animate-spin" />
            <span>Sending</span>
          </span>
        );
      case "queued":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Queued</span>
          </span>
        );
      case "undelivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Undelivered</span>
          </span>
        );
      case "failed":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Failed</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border/80 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time feed of SMS transmissions with carrier verification.
          </p>
        </div>

        {/* Search & Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter number or text..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-muted/60 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-44 sm:w-56"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/60 text-xs overflow-x-auto no-scrollbar">
            {["all", "delivered", "sent", "queued", "undelivered", "failed"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-2 py-1 rounded-lg capitalize font-medium transition-all whitespace-nowrap text-[11px] ${
                  selectedStatus === st
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/80 text-muted-foreground font-semibold">
              <th className="pb-3 pr-4">Recipient Country</th>
              <th className="pb-3 pr-4">Masked Number</th>
              <th className="pb-3 pr-4 min-w-[240px]">Message Preview</th>
              <th className="pb-3 pr-4">Date & Time</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredMessages.map((msg) => (
              <tr
                key={msg.id}
                className="hover:bg-muted/40 transition-colors group cursor-pointer"
                onClick={() => setSelectedMessage(msg)}
              >
                {/* Country */}
                <td className="py-3.5 pr-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{msg.country.flag}</span>
                    <span className="font-semibold text-foreground">
                      {msg.country.name}
                    </span>
                  </div>
                </td>

                {/* Masked Number */}
                <td className="py-3.5 pr-4 whitespace-nowrap">
                  <span className="font-mono font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                    {msg.maskedNumber}
                  </span>
                </td>

                {/* Message Preview */}
                <td className="py-3.5 pr-4 max-w-xs">
                  <p className="truncate text-foreground/90 font-normal">
                    {msg.messagePreview}
                  </p>
                </td>

                {/* Date & Time */}
                <td className="py-3.5 pr-4 whitespace-nowrap text-muted-foreground">
                  {msg.timestamp}
                </td>

                {/* Status */}
                <td className="py-3.5 pr-4 whitespace-nowrap">
                  {getStatusBadge(msg.status)}
                </td>

                {/* Action arrow */}
                <td className="py-3.5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    className="p-1 rounded-md text-muted-foreground group-hover:text-primary transition-colors"
                    aria-label="View message details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {filteredMessages.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No messaging activity matching the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3 pt-1">
        {filteredMessages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => setSelectedMessage(msg)}
            className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2.5 active:bg-muted/70 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{msg.country.flag}</span>
                <span className="font-semibold text-xs text-foreground">
                  {msg.country.name}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {msg.maskedNumber}
                </span>
              </div>
              <div>{getStatusBadge(msg.status)}</div>
            </div>

            <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">
              {msg.messagePreview}
            </p>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              <span>{msg.timestamp}</span>
              <span className="font-mono text-primary flex items-center gap-1 font-medium">
                {msg.carrier}
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Link to Message History */}
      {showViewAll && (
        <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span>Displaying latest {filteredMessages.length} transmissions</span>
          <Link
            href="/dashboard/history"
            className="font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All Message History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedMessage.country.flag}</span>
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    SMS Transmission Telemetry
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    ID: {selectedMessage.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {/* Content Preview */}
            <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Message Content
              </span>
              <p className="text-xs text-foreground leading-relaxed">
                {selectedMessage.messagePreview}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">Recipient</span>
                <span className="font-mono font-semibold text-foreground">
                  {selectedMessage.maskedNumber}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">Delivery Status</span>
                <div className="pt-0.5">{getStatusBadge(selectedMessage.status)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">Carrier Route</span>
                <span className="font-semibold text-foreground text-[11px] truncate block">
                  {selectedMessage.carrier || "Twilio Direct"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">Handset Latency</span>
                <span className="font-mono font-semibold text-foreground text-[11px]">
                  {selectedMessage.latency}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMessage(null)}
                className="text-xs"
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

