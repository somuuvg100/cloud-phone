"use client";

import * as React from "react";
import Link from "next/link";
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Zap,
  Play,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Globe2,
} from "lucide-react";
import { Webphone } from "@/components/blacktel/webphone";
import { CallLogEntry, VirtualNumber } from "@/types/blacktel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletTopupModal } from "@/components/blacktel/wallet-topup-modal";

export default function CallsPage() {
  const [callLogs, setCallLogs] = React.useState<CallLogEntry[]>([]);
  const [myNumbers, setMyNumbers] = React.useState<VirtualNumber[]>([]);
  const [dialedTarget, setDialedTarget] = React.useState<string>("");
  const [walletBalance, setWalletBalance] = React.useState<number>(120);
  const [showTopupModal, setShowTopupModal] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const fetchCallsData = React.useCallback(async () => {
    try {
      const [resCalls, resNumbers, resWallet] = await Promise.all([
        fetch("/api/webphone/call"),
        fetch("/api/numbers/my"),
        fetch("/api/wallet"),
      ]);

      const dataCalls = await resCalls.json();
      const dataNumbers = await resNumbers.json();
      const dataWallet = await resWallet.json();

      if (dataCalls.calls) setCallLogs(dataCalls.calls);
      if (dataNumbers.numbers) setMyNumbers(dataNumbers.numbers);
      if (dataWallet.wallet) setWalletBalance(dataWallet.wallet.credits);
    } catch (err) {
      console.error("Failed to load calls:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCallsData();
  }, [fetchCallsData]);

  const handleRedial = (phone: string) => {
    setDialedTarget(phone);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Browser Webphone & Call History
            </h1>
            <Badge variant="pill" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              WebRTC HD
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Place outbound calls worldwide and receive inbound calls directly inside your web browser.
          </p>
        </div>

        {/* Live Wallet Pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTopupModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-foreground hover:bg-amber-500/20 transition-all shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
              ⚡
            </div>
            <div className="text-left">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block -mb-0.5">
                Balance
              </span>
              <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                {walletBalance} Credits
              </span>
            </div>
          </button>

          <Link href="/dashboard/numbers">
            <Button variant="outline" size="sm" className="text-xs h-10 px-3 rounded-2xl">
              Virtual Numbers
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Webphone (left) + Call Logs (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Webphone (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              In-Browser Telephone
            </span>
            <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              VoIP Online
            </span>
          </div>

          <Webphone
            activeNumbers={myNumbers}
            prefilledNumber={dialedTarget}
            onCallEnded={fetchCallsData}
          />
        </div>

        {/* Right Column: Call Logs History (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-card border border-border/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">Call Logs & Telemetry</h2>
              <Badge variant="pill" className="text-[10px]">
                {callLogs.length} Records
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchCallsData}
              className="text-xs h-8 px-2.5 gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Logs List */}
          <div className="divide-y divide-border/60">
            {callLogs.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                No recent calls. Dial any number on the Webphone to start a call.
              </div>
            ) : (
              callLogs.map((log) => {
                const isOutbound = log.direction === "outbound";
                const mins = Math.floor(log.durationSeconds / 60);
                const secs = log.durationSeconds % 60;
                const formattedDur = `${mins}m ${secs}s`;

                return (
                  <div
                    key={log.id}
                    className="py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-muted/30 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isOutbound
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {isOutbound ? (
                          <PhoneOutgoing className="w-4 h-4" />
                        ) : (
                          <PhoneIncoming className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 font-bold font-mono text-foreground">
                          <span>{log.countryFlag}</span>
                          <span>{isOutbound ? log.toNumber : log.fromNumber}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>
                            {isOutbound ? "Outgoing from:" : "Incoming to:"}{" "}
                            <span className="font-mono text-foreground">{log.fromNumber}</span>
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(log.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-foreground font-mono block">
                          {log.durationSeconds > 0 ? formattedDur : "No Answer"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {log.costCredits > 0 ? `⚡ ${log.costCredits} credits` : "Free"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRedial(isOutbound ? log.toNumber : log.fromNumber)}
                        className="p-2 rounded-xl border border-border/80 hover:border-primary hover:text-primary text-muted-foreground transition-colors"
                        title="Redial on Webphone"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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

