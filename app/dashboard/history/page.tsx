"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Calendar,
  Globe2,
  Trash2,
  Download,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Layers,
  DollarSign,
  Copy,
  Check,
  Flag,
  ShieldAlert,
} from "lucide-react";
import { COUNTRIES, CountryData } from "@/lib/countries";
import { DeliveryStatus } from "@/types/dashboard";
import { MOCK_RECENT_ACTIVITY } from "@/lib/mock-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getUserMessages, deleteMessage, clearUserMessageHistory } from "@/services/database";
import { maskPhoneNumber } from "@/lib/phone-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AbuseReportModal } from "@/components/dashboard/abuse-report-modal";

interface DisplayMessage {
  id: string;
  recipientPhone: string;
  recipientCountry: string;
  countryFlag: string;
  countryDialCode: string;
  messageBody: string;
  providerMessageId: string | null;
  status: DeliveryStatus;
  createdAt: string;
  deliveredAt: string | null;
  segments: number;
  costEstimate: number;
  carrier?: string;
  latency?: string;
}

export default function MessageHistoryPage() {
  const [messages, setMessages] = React.useState<DisplayMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successNotice, setSuccessNotice] = React.useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [countryFilter, setCountryFilter] = React.useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = React.useState<string>("all");

  // Privacy: unmask toggle
  const [unmaskAll, setUnmaskAll] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  // Modals
  const [selectedMessage, setSelectedMessage] = React.useState<DisplayMessage | null>(null);
  const [messageToDelete, setMessageToDelete] = React.useState<DisplayMessage | null>(null);
  const [messageToReport, setMessageToReport] = React.useState<DisplayMessage | null>(null);
  const [showPurgeModal, setShowPurgeModal] = React.useState(false);
  const [purgeRetentionDays, setPurgeRetentionDays] = React.useState<number>(30);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Fetch messages from Supabase (or fallback to rich mock data)
  const fetchMessages = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: dbRows, error: dbErr } = await getUserMessages(user.id, { limit: 100 });
          if (dbErr) throw new Error(dbErr);

          if (dbRows && dbRows.length > 0) {
            const mapped: DisplayMessage[] = dbRows.map((r) => {
              const countryObj = COUNTRIES.find(
                (c) => c.name.toLowerCase() === r.recipient_country.toLowerCase() || c.code === r.recipient_country
              );
              return {
                id: r.id,
                recipientPhone: r.recipient_phone,
                recipientCountry: r.recipient_country,
                countryFlag: countryObj?.flag || "🌐",
                countryDialCode: countryObj?.dialCode || "+",
                messageBody: r.message_body,
                providerMessageId: r.provider_message_id,
                status: r.status as DeliveryStatus,
                createdAt: r.created_at,
                deliveredAt: r.delivered_at,
                segments: r.segments || 1,
                costEstimate: r.cost_estimate || 0.0079,
                carrier: "Tier-1 Carrier Route",
                latency: r.delivered_at ? "1.2s" : "In Transit",
              };
            });
            setMessages(mapped);
            setLoading(false);
            return;
          }
        }
      }

      // Default Demonstration Data
      const fallbackList: DisplayMessage[] = MOCK_RECENT_ACTIVITY.map((item, idx) => ({
        id: item.id,
        recipientPhone: item.fullNumber || item.maskedNumber,
        recipientCountry: item.country.name,
        countryFlag: item.country.flag,
        countryDialCode: item.country.dialCode,
        messageBody: item.messagePreview,
        providerMessageId: `SM_${idx}f9821a00${Date.now()}`,
        status: item.status,
        createdAt: new Date(Date.now() - idx * 18 * 60 * 1000).toISOString(),
        deliveredAt:
          item.status === "delivered"
            ? new Date(Date.now() - idx * 18 * 60 * 1000 + 1200).toISOString()
            : null,
        segments: item.segments || 1,
        costEstimate: parseFloat(item.cost?.replace("$", "") || "0.0079"),
        carrier: item.carrier,
        latency: item.latency,
      }));
      setMessages(fallbackList);
    } catch (err: any) {
      console.error("Error fetching message ledger:", err);
      setError(err.message || "Failed to load message history");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Handle single message deletion
  const handleDeleteSingle = async () => {
    if (!messageToDelete) return;
    setIsDeleting(true);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await deleteMessage(messageToDelete.id, user.id);
        }
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
      setSuccessNotice("Message record permanently deleted in compliance with privacy retention policy.");
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete message");
    } finally {
      setIsDeleting(false);
      setMessageToDelete(null);
    }
  };

  // Handle batch purge
  const handlePurgeHistory = async () => {
    setIsDeleting(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await clearUserMessageHistory(user.id, purgeRetentionDays);
        }
      }

      if (purgeRetentionDays === 0) {
        setMessages([]);
      } else {
        const cutoff = Date.now() - purgeRetentionDays * 24 * 60 * 60 * 1000;
        setMessages((prev) => prev.filter((m) => new Date(m.createdAt).getTime() >= cutoff));
      }

      setSuccessNotice(
        purgeRetentionDays === 0
          ? "All transmission history cleared."
          : `Purged records older than ${purgeRetentionDays} days.`
      );
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err: any) {
      setError(err.message || "Failed to purge messages");
    } finally {
      setIsDeleting(false);
      setShowPurgeModal(false);
    }
  };

  // Filter messages
  const filteredMessages = React.useMemo(() => {
    const now = Date.now();
    return messages.filter((msg) => {
      // 1. Search by recipient number or text
      const matchesSearch =
        !searchQuery.trim() ||
        msg.recipientPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.messageBody.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (msg.providerMessageId && msg.providerMessageId.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Status filter
      const matchesStatus = statusFilter === "all" || msg.status === statusFilter;

      // 3. Country filter
      const matchesCountry = countryFilter === "all" || msg.recipientCountry.toLowerCase() === countryFilter.toLowerCase();

      // 4. Date filter
      let matchesDate = true;
      const msgTime = new Date(msg.createdAt).getTime();
      if (dateRangeFilter === "today") {
        matchesDate = now - msgTime < 24 * 60 * 60 * 1000;
      } else if (dateRangeFilter === "7days") {
        matchesDate = now - msgTime < 7 * 24 * 60 * 60 * 1000;
      } else if (dateRangeFilter === "30days") {
        matchesDate = now - msgTime < 30 * 24 * 60 * 60 * 1000;
      }

      return matchesSearch && matchesStatus && matchesCountry && matchesDate;
    });
  }, [messages, searchQuery, statusFilter, countryFilter, dateRangeFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / itemsPerPage));
  const paginatedMessages = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMessages.slice(start, start + itemsPerPage);
  }, [filteredMessages, currentPage]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper for delivery status badge
  const renderStatusBadge = (status: DeliveryStatus | string) => {
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Message Transmission History
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit log of all dispatched SMS with carrier delivery receipts, timestamps, and privacy masking.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMessages}
            disabled={loading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPurgeModal(true)}
            className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Ledger</span>
          </Button>

          <Link href="/dashboard/send">
            <Button variant="glow" size="sm" className="text-xs gap-1.5 shadow-md">
              <Send className="w-3.5 h-3.5" />
              <span>Compose New</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by number or keyword..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* 2. Country Filter */}
          <div className="relative">
            <Globe2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
            >
              <option value="all">All Countries (180+)</option>
              {COUNTRIES.slice(0, 15).map((c) => (
                <option key={c.code} value={c.name}>
                  {c.flag} {c.name} ({c.dialCode})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Delivery Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
            >
              <option value="all">All Delivery Statuses</option>
              <option value="delivered">Delivered (Handset Confirmed)</option>
              <option value="sent">Sent (Carrier ACK)</option>
              <option value="sending">Sending (In Transit)</option>
              <option value="queued">Queued in Dispatcher</option>
              <option value="undelivered">Undelivered (DND / Unreachable)</option>
              <option value="failed">Failed (Carrier Rejected)</option>
            </select>
          </div>

          {/* 4. Date Range Filter */}
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={dateRangeFilter}
              onChange={(e) => {
                setDateRangeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today (Last 24 Hours)</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Mask/Unmask Privacy Toggle & Status Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Showing:</span>
            <span className="font-semibold text-foreground font-mono">
              {filteredMessages.length} {filteredMessages.length === 1 ? "record" : "records"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setUnmaskAll(!unmaskAll)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium p-1 rounded-lg hover:bg-muted transition-colors"
          >
            {unmaskAll ? <EyeOff className="w-3.5 h-3.5 text-primary" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{unmaskAll ? "Mask Recipient Numbers" : "Unmask Recipient Numbers"}</span>
          </button>
        </div>
      </div>

      {/* Main Table View */}
      <div className="rounded-2xl bg-card border border-border/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs font-medium">Loading transmission records from Supabase...</span>
          </div>
        ) : paginatedMessages.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">No message records found</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                No transmissions matched your active search or filters. Try adjusting your query or send a new SMS.
              </p>
            </div>
            <Link href="/dashboard/send">
              <Button variant="glow" size="sm" className="text-xs mt-2">
                Send New Message
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Recipient Phone</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Message Content</th>
                  <th className="py-3.5 px-4">Timestamp (UTC)</th>
                  <th className="py-3.5 px-4">Delivery Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedMessages.map((msg) => {
                  const displayPhone = unmaskAll ? msg.recipientPhone : maskPhoneNumber(msg.recipientPhone);

                  return (
                    <tr
                      key={msg.id}
                      className="hover:bg-muted/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedMessage(msg)}
                    >
                      {/* Country Flag & Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{msg.countryFlag}</span>
                          <span className="font-semibold text-foreground">
                            {msg.recipientCountry}
                          </span>
                        </div>
                      </td>

                      {/* Recipient Phone (Masked / Unmasked) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                          {displayPhone}
                        </span>
                      </td>

                      {/* Message Content Preview */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="truncate text-foreground/90 font-normal">
                          {msg.messageBody}
                        </p>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                        <div>{new Date(msg.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-muted-foreground/80 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(msg.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(msg)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Inspect Telemetry"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMessageToReport(msg)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Report Abuse / Spam"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMessageToDelete(msg)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredMessages.length > itemsPerPage && (
          <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
              <span className="font-semibold text-foreground">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2 text-xs"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Message Details Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedMessage.countryFlag}</span>
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    SMS Transmission Telemetry
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                    <span>ID: {selectedMessage.id.slice(0, 16)}...</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedMessage.id, selectedMessage.id)}
                      className="hover:text-foreground"
                    >
                      {copiedId === selectedMessage.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
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

            {/* Message Body Content */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Full Message Text
              </span>
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {selectedMessage.messageBody}
              </div>
            </div>

            {/* Telemetry Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Recipient Handset</span>
                <span className="font-mono font-semibold text-foreground">
                  {selectedMessage.recipientPhone}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Delivery Status</span>
                <div className="pt-0.5">{renderStatusBadge(selectedMessage.status)}</div>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Dispatched Timestamp</span>
                <span className="font-mono text-foreground text-[11px]">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Handset Delivered At</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">
                  {selectedMessage.deliveredAt
                    ? new Date(selectedMessage.deliveredAt).toLocaleString()
                    : "Awaiting Carrier Webhook"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Twilio Provider SID</span>
                <span className="font-mono text-muted-foreground text-[10px] truncate block">
                  {selectedMessage.providerMessageId || "N/A"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Billable Segments / Cost</span>
                <span className="font-mono font-semibold text-foreground text-[11px]">
                  {selectedMessage.segments} Segments (~${selectedMessage.costEstimate.toFixed(4)} USD)
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border/60">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMessageToDelete(selectedMessage);
                    setSelectedMessage(null);
                  }}
                  className="text-xs text-destructive hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete record</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessageToReport(selectedMessage);
                    setSelectedMessage(null);
                  }}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report Abuse / Spam</span>
                </button>
              </div>

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

      {/* Delete Single Message Confirmation Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <div className="p-2.5 rounded-xl bg-destructive/10">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">
                Delete Message Record?
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this transmission record to{" "}
              <span className="font-mono font-semibold text-foreground">
                {messageToDelete.recipientPhone}
              </span>
              ? This action cannot be undone and permanently purges the delivery audit record.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setMessageToDelete(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteSingle}
                className="text-xs font-semibold"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Purge Message History Retention Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <div className="p-2.5 rounded-xl bg-destructive/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  Data Retention & Ledger Purge
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage privacy data retention policies
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Under GDPR and privacy regulations, organizations may periodically purge transmission records. Choose your desired retention window:
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Retention Policy Window
              </label>
              <select
                value={purgeRetentionDays}
                onChange={(e) => setPurgeRetentionDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value={30}>Purge records older than 30 days (Recommended)</option>
                <option value={7}>Purge records older than 7 days</option>
                <option value={0}>Purge all transmission history (Complete Wipe)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
              ⚠️ Warning: Purged records cannot be recovered.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setShowPurgeModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handlePurgeHistory}
                className="text-xs font-semibold"
              >
                {isDeleting ? "Purging..." : "Confirm Data Purge"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Abuse & Unsolicited Messaging Report Modal */}
      {messageToReport && (
        <AbuseReportModal
          isOpen={Boolean(messageToReport)}
          onClose={() => setMessageToReport(null)}
          targetPhone={messageToReport.recipientPhone}
          evidenceMessageId={messageToReport.id}
          evidenceText={messageToReport.messageBody}
          onSuccess={() => {
            setSuccessNotice("Abuse report filed and recipient number has been suppressed.");
            setTimeout(() => setSuccessNotice(null), 4000);
          }}
        />
      )}
    </div>
  );
}
