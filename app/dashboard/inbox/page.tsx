"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Phone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Zap,
  RefreshCw,
  Search,
  Key,
  ShieldCheck,
  ChevronDown,
  Loader2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConversationThread, InboxMessage, VirtualNumber } from "@/types/blacktel";
import { WalletTopupModal } from "@/components/blacktel/wallet-topup-modal";

export default function InboxPage() {
  const [threads, setThreads] = React.useState<ConversationThread[]>([]);
  const [selectedThreadContact, setSelectedThreadContact] = React.useState<string | null>(null);
  const [myNumbers, setMyNumbers] = React.useState<VirtualNumber[]>([]);
  const [selectedNumberFilter, setSelectedNumberFilter] = React.useState<string>("all");
  const [replyText, setReplyText] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSendingReply, setIsSendingReply] = React.useState<boolean>(false);
  const [isSimulating, setIsSimulating] = React.useState<boolean>(false);
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const [walletBalance, setWalletBalance] = React.useState<number>(120);
  const [showTopupModal, setShowTopupModal] = React.useState<boolean>(false);

  // Fetch threads and numbers
  const fetchInboxData = React.useCallback(async () => {
    try {
      const [resThreads, resNumbers, resWallet] = await Promise.all([
        fetch(`/api/inbox?numberId=${selectedNumberFilter}`),
        fetch("/api/numbers/my"),
        fetch("/api/wallet"),
      ]);

      const dataThreads = await resThreads.json();
      const dataNumbers = await resNumbers.json();
      const dataWallet = await resWallet.json();

      if (dataThreads.threads) {
        setThreads(dataThreads.threads);
        if (!selectedThreadContact && dataThreads.threads.length > 0) {
          setSelectedThreadContact(dataThreads.threads[0].contactPhone);
        }
      }
      if (dataNumbers.numbers) setMyNumbers(dataNumbers.numbers);
      if (dataWallet.wallet) setWalletBalance(dataWallet.wallet.credits);
    } catch (err) {
      console.error("Failed to load inbox data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedNumberFilter, selectedThreadContact]);

  React.useEffect(() => {
    fetchInboxData();
  }, [fetchInboxData]);

  // Active thread
  const activeThread = threads.find((t) => t.contactPhone === selectedThreadContact) || threads[0];

  // Send reply message
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread || isSendingReply) return;

    setIsSendingReply(true);
    try {
      // Find virtual number ID
      const vnum = myNumbers.find((n) => n.phoneNumber === activeThread.virtualNumberPhone) || myNumbers[0];
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          virtualNumberId: vnum?.id || "vn_reachout_us_01",
          recipientPhone: activeThread.contactPhone,
          body: replyText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) setShowTopupModal(true);
        throw new Error(data.error || "Failed to send message");
      }

      setReplyText("");
      fetchInboxData();
    } catch (err: any) {
      alert(err.message || "Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  // Simulate an incoming SMS / OTP test
  const handleSimulateIncoming = async (
    serviceName: "whatsapp" | "google" | "telegram" | "bank" | "uber"
  ) => {
    setIsSimulating(true);
    try {
      const vnum = myNumbers.find((n) => n.phoneNumber === activeThread?.virtualNumberPhone) || myNumbers[0];
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate",
          virtualNumberId: vnum?.id || "vn_reachout_us_01",
          serviceName,
        }),
      });

      if (res.ok) {
        await fetchInboxData();
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered threads by search
  const filteredThreads = threads.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.contactPhone.toLowerCase().includes(q) ||
      t.lastMessage.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border/80 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">
                2-Way SMS Messenger & OTP Inbox
              </h1>
              <Badge variant="pill" className="text-[10px]">
                Blacktel Suite
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Send and receive live SMS, OTP verification codes, and WhatsApp SIM messages.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Virtual Number selector */}
          <div className="relative">
            <select
              value={selectedNumberFilter}
              onChange={(e) => setSelectedNumberFilter(e.target.value)}
              className="text-xs font-mono font-medium py-1.5 px-3 pr-7 rounded-xl bg-muted/60 border border-border text-foreground appearance-none"
            >
              <option value="all">All Virtual Lines</option>
              {myNumbers.map((num) => (
                <option key={num.id} value={num.id}>
                  {num.countryFlag} {num.phoneNumber}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Wallet Pill */}
          <button
            type="button"
            onClick={() => setShowTopupModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            <span>⚡ {walletBalance}</span>
            <span className="text-[10px] text-muted-foreground font-normal">Credits</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchInboxData}
            className="h-8 px-2 text-xs"
            title="Refresh inbox"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Split-Pane Messenger Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* LEFT PANE: Conversation Threads List (4 cols) */}
        <div className="md:col-span-4 lg:col-span-4 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col min-h-0 overflow-hidden">
          {/* Threads search bar */}
          <div className="p-3 border-b border-border/60 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-muted/50 border border-border/70 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Threads stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-10 px-4 text-xs text-muted-foreground">
                No active conversation threads. Incoming messages will appear here.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = activeThread?.contactPhone === thread.contactPhone;
                return (
                  <button
                    key={thread.contactPhone}
                    type="button"
                    onClick={() => setSelectedThreadContact(thread.contactPhone)}
                    className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 ${
                      isSelected
                        ? "bg-primary/10 border-l-4 border-primary"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-lg shrink-0 shadow-sm border border-border/60">
                      {thread.countryFlag}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-foreground truncate font-mono">
                          {thread.contactPhone}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(thread.lastMessageAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground truncate leading-relaxed">
                        {thread.lastMessage}
                      </p>

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] font-mono text-muted-foreground/70">
                          To: {thread.virtualNumberPhone}
                        </span>
                        {thread.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground font-bold text-[9px]">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Active Chat & OTP Viewer (8 cols) */}
        <div className="md:col-span-8 lg:col-span-8 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col min-h-0 overflow-hidden">
          {activeThread ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 sm:p-4 border-b border-border/60 flex items-center justify-between shrink-0 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl shrink-0 border border-border/60">
                    {activeThread.countryFlag}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground font-mono">
                        {activeThread.contactPhone}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(activeThread.contactPhone)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Copy phone"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Routed via virtual line:{" "}
                      <span className="font-mono font-medium text-foreground">
                        {activeThread.virtualNumberPhone}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Real-Time OTP Test Simulation Menu */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase hidden sm:inline">
                    Simulate OTP:
                  </span>
                  {(["whatsapp", "google", "telegram", "bank"] as const).map((svc) => (
                    <button
                      key={svc}
                      type="button"
                      disabled={isSimulating}
                      onClick={() => handleSimulateIncoming(svc)}
                      className="px-2 py-1 rounded-lg border border-border/70 hover:border-primary text-[10px] font-semibold text-muted-foreground hover:text-primary capitalize transition-all bg-background"
                      title={`Simulate receiving ${svc} verification SMS`}
                    >
                      {svc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages Bubble Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {activeThread.messages.map((msg) => {
                  const isInbound = msg.direction === "inbound";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isInbound ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-sm text-xs leading-relaxed space-y-2 ${
                          isInbound
                            ? "bg-muted/70 text-foreground border border-border/70 rounded-tl-sm"
                            : "bg-primary text-primary-foreground rounded-tr-sm"
                        }`}
                      >
                        {/* OTP Highlight Box */}
                        {msg.isOtp && msg.otpCode && (
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5">
                              <Key className="w-4 h-4 shrink-0" />
                              <span className="font-mono font-bold text-sm tracking-wider">
                                {msg.otpCode}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(msg.otpCode!)}
                              className="px-2 py-1 rounded-lg bg-amber-500 text-white font-semibold text-[10px] hover:bg-amber-600 transition-colors flex items-center gap-1"
                            >
                              {copiedCode === msg.otpCode ? (
                                <>
                                  <Check className="w-3 h-3" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy Code
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        <p className="whitespace-pre-wrap font-sans">{msg.body}</p>

                        <div
                          className={`text-[9px] font-mono pt-1 flex items-center justify-end gap-1 ${
                            isInbound ? "text-muted-foreground" : "text-primary-foreground/70"
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Reply Bar */}
              <form
                onSubmit={handleSendReply}
                className="p-3 border-t border-border/60 bg-muted/20 shrink-0 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Reply to ${activeThread.contactPhone}... (1 credit)`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs rounded-2xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button
                  type="submit"
                  variant="glow"
                  size="sm"
                  disabled={isSendingReply || !replyText.trim()}
                  className="rounded-2xl h-10 px-4 gap-1.5 font-semibold text-xs shrink-0"
                >
                  {isSendingReply ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
              <MessageSquare className="w-10 h-10 opacity-40" />
              <p className="text-sm font-semibold">Select a conversation thread</p>
              <p className="text-xs">Or rent a virtual number to start receiving SMS messages.</p>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Top-up Modal */}
      <WalletTopupModal
        isOpen={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        currentBalance={walletBalance}
        onSuccess={(b) => setWalletBalance(b)}
      />
    </div>
  );
}

