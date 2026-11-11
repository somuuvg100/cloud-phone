"use client";

import * as React from "react";
import Link from "next/link";
import {
  Globe2,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Zap,
  Filter,
  Search,
  Settings,
  Mail,
  ArrowRight,
  MessageSquare,
  PhoneCall,
  Trash2,
  Sparkles,
  RefreshCw,
  Loader2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvailableNumber, VirtualNumber, VirtualNumberType } from "@/types/blacktel";
import { WalletTopupModal } from "@/components/blacktel/wallet-topup-modal";

export default function VirtualNumbersPage() {
  const [activeTab, setActiveTab] = React.useState<"store" | "my_numbers">("store");

  // Store numbers & filters
  const [availableNumbers, setAvailableNumbers] = React.useState<AvailableNumber[]>([]);
  const [loadingStore, setLoadingStore] = React.useState(true);
  const [selectedCountry, setSelectedCountry] = React.useState("all");
  const [selectedType, setSelectedType] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // My numbers
  const [myNumbers, setMyNumbers] = React.useState<VirtualNumber[]>([]);
  const [loadingMy, setLoadingMy] = React.useState(true);

  // Wallet
  const [walletBalance, setWalletBalance] = React.useState(120);
  const [showTopupModal, setShowTopupModal] = React.useState(false);

  // Number Rental modal
  const [numberToRent, setNumberToRent] = React.useState<AvailableNumber | null>(null);
  const [isRenting, setIsRenting] = React.useState(false);
  const [rentError, setRentError] = React.useState<string | null>(null);
  const [rentSuccess, setRentSuccess] = React.useState<string | null>(null);

  // Settings drawer for an active number
  const [configuredNumber, setConfiguredNumber] = React.useState<VirtualNumber | null>(null);
  const [forwardPhone, setForwardPhone] = React.useState("");
  const [forwardEmail, setForwardEmail] = React.useState("");
  const [autoReply, setAutoReply] = React.useState("");
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);

  // Load available numbers
  const fetchAvailableNumbers = React.useCallback(async () => {
    setLoadingStore(true);
    try {
      const params = new URLSearchParams();
      if (selectedCountry !== "all") params.append("country", selectedCountry);
      if (selectedType !== "all") params.append("type", selectedType);

      const res = await fetch(`/api/numbers/available?${params.toString()}`);
      const data = await res.json();
      if (data.numbers) setAvailableNumbers(data.numbers);
    } catch (err) {
      console.error("Failed to load numbers catalog:", err);
    } finally {
      setLoadingStore(false);
    }
  }, [selectedCountry, selectedType]);

  // Load user's active numbers & wallet
  const fetchUserData = React.useCallback(async () => {
    setLoadingMy(true);
    try {
      const [resNum, resWallet] = await Promise.all([
        fetch("/api/numbers/my"),
        fetch("/api/wallet"),
      ]);
      const dataNum = await resNum.json();
      const dataWallet = await resWallet.json();

      if (dataNum.numbers) setMyNumbers(dataNum.numbers);
      if (dataWallet.wallet) setWalletBalance(dataWallet.wallet.credits);
    } catch (err) {
      console.error("Failed to load user numbers:", err);
    } finally {
      setLoadingMy(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAvailableNumbers();
    fetchUserData();
  }, [fetchAvailableNumbers, fetchUserData]);

  // Handle Rent Number
  const handleConfirmRent = async () => {
    if (!numberToRent) return;
    setIsRenting(true);
    setRentError(null);
    setRentSuccess(null);

    try {
      const res = await fetch("/api/numbers/rent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: numberToRent.phoneNumber }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setShowTopupModal(true);
        }
        throw new Error(data.error || "Failed to rent virtual number.");
      }

      setRentSuccess(data.message || `Rented ${numberToRent.phoneNumber}!`);
      if (data.newBalance !== undefined) setWalletBalance(data.newBalance);

      // Refresh numbers
      fetchUserData();
      setTimeout(() => {
        setNumberToRent(null);
        setRentSuccess(null);
        setActiveTab("my_numbers");
      }, 1500);
    } catch (err: any) {
      setRentError(err.message || "Failed to rent number");
    } finally {
      setIsRenting(false);
    }
  };

  // Open settings drawer
  const handleOpenSettings = (num: VirtualNumber) => {
    setConfiguredNumber(num);
    setForwardPhone(num.forwardToPhone || "");
    setForwardEmail(num.forwardToEmail || "");
    setAutoReply(num.autoReplyText || "");
  };

  // Save number settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuredNumber) return;
    setIsSavingSettings(true);

    try {
      const res = await fetch("/api/numbers/my", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numberId: configuredNumber.id,
          forwardToPhone: forwardPhone.trim() || null,
          forwardToEmail: forwardEmail.trim() || null,
          autoReplyText: autoReply.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update settings");

      fetchUserData();
      setConfiguredNumber(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Cancel number
  const handleCancelNumber = async (numberId: string) => {
    if (!confirm("Are you sure you want to release this virtual number?")) return;
    try {
      const res = await fetch("/api/numbers/my", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberId }),
      });
      if (res.ok) {
        setMyNumbers((prev) => prev.filter((n) => n.id !== numberId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter store numbers by search query
  const filteredAvailable = availableNumbers.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.phoneNumber.toLowerCase().includes(q) ||
      n.countryName.toLowerCase().includes(q) ||
      n.region?.toLowerCase().includes(q) ||
      n.bestFor.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Virtual Phone Numbers
            </h1>
            <Badge variant="pill" className="text-[10px] bg-primary/10 text-primary border-primary/20">
              Blacktel Suite
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Rent international numbers across 25+ countries for SMS, Calls, WhatsApp SIM, and OTP verification.
          </p>
        </div>

        {/* Live Wallet Pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTopupModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-foreground hover:bg-amber-500/20 transition-all shadow-sm group"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
              ⚡
            </div>
            <div className="text-left">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block -mb-0.5">
                Wallet Balance
              </span>
              <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                {walletBalance} Credits
              </span>
            </div>
            <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground ml-1" />
          </button>

          <Link href="/dashboard/inbox">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-10 px-3 rounded-2xl">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>2-Way Inbox</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("store")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "store"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>Browse Number Store</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("my_numbers")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === "my_numbers"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>My Active Numbers ({myNumbers.length})</span>
        </button>
      </div>

      {/* TAB 1: Number Store */}
      {activeTab === "store" && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            {/* Search */}
            <div className="sm:col-span-4 relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by area code, city, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Country Selector */}
            <div className="sm:col-span-4">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">🌐 All Countries (25+ Available)</option>
                <option value="US">🇺🇸 United States</option>
                <option value="GB">🇬🇧 United Kingdom</option>
                <option value="DE">🇩🇪 Germany</option>
                <option value="CA">🇨🇦 Canada</option>
                <option value="FR">🇫🇷 France</option>
                <option value="AU">🇦🇺 Australia</option>
                <option value="JP">🇯🇵 Japan</option>
                <option value="BR">🇧🇷 Brazil</option>
                <option value="IN">🇮🇳 India</option>
                <option value="NL">🇳🇱 Netherlands</option>
              </select>
            </div>

            {/* Type Selector */}
            <div className="sm:col-span-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">⚡ All Number Types</option>
                <option value="mobile">Mobile (SMS & Calls)</option>
                <option value="whatsapp_sim">WhatsApp SIM (OTPs)</option>
                <option value="local">Local City Number</option>
                <option value="toll_free">Toll-Free 800</option>
                <option value="trash_sim">Trash / Disposable 7-Day Line</option>
              </select>
            </div>
          </div>

          {/* Numbers Grid */}
          {loadingStore ? (
            <div className="flex items-center justify-center py-16 gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Querying global telecommunication inventory...</span>
            </div>
          ) : filteredAvailable.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-card border border-border/80 text-muted-foreground text-xs space-y-2">
              <p>No available numbers match your selected filter.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCountry("all");
                  setSelectedType("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAvailable.map((num) => {
                const isOwned = myNumbers.some((m) => m.phoneNumber === num.phoneNumber);
                const typeLabel = {
                  mobile: "Mobile SIM",
                  whatsapp_sim: "WhatsApp SIM",
                  local: "Local Landline",
                  toll_free: "Toll-Free",
                  trash_sim: "Trash SIM",
                }[num.type];

                return (
                  <div
                    key={num.phoneNumber}
                    className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm hover:border-primary/50 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Country & Type */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{num.countryFlag}</span>
                          <div>
                            <span className="font-semibold text-xs text-foreground block">
                              {num.countryName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {num.region || "National"}
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant={num.type === "whatsapp_sim" ? "secondary" : "pill"}
                          className="text-[10px] font-bold"
                        >
                          {typeLabel}
                        </Badge>
                      </div>

                      {/* Phone Number */}
                      <div className="mt-3 py-2 px-3 rounded-xl bg-muted/50 border border-border/60">
                        <span className="text-sm font-bold font-mono text-foreground tracking-wide">
                          {num.phoneNumber}
                        </span>
                      </div>

                      {/* Capabilities */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {num.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>

                      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                        Best for: <span className="text-foreground font-medium">{num.bestFor}</span>
                      </p>
                    </div>

                    {/* Bottom Price & Action */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                      <div>
                        <span className="text-base font-bold text-foreground">
                          ⚡ {num.monthlyPriceCredits}
                        </span>
                        <span className="text-[10px] text-muted-foreground"> / month</span>
                      </div>

                      {isOwned ? (
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active on Account
                        </span>
                      ) : (
                        <Button
                          variant="glow"
                          size="sm"
                          onClick={() => setNumberToRent(num)}
                          className="text-xs font-semibold gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Rent Number</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: My Active Numbers */}
      {activeTab === "my_numbers" && (
        <div className="space-y-4">
          {loadingMy ? (
            <div className="flex items-center justify-center py-16 gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Loading your active virtual numbers...</span>
            </div>
          ) : myNumbers.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-card border border-border/80 space-y-3">
              <Globe2 className="w-8 h-8 text-muted-foreground mx-auto" />
              <h3 className="font-bold text-sm text-foreground">No Active Virtual Numbers</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You haven&apos;t rented any virtual phone numbers yet. Browse the inventory to get your first US, UK, or EU number.
              </p>
              <Button size="sm" onClick={() => setActiveTab("store")}>
                Browse Number Store
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myNumbers.map((num) => (
                <div
                  key={num.id}
                  className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{num.countryFlag}</span>
                      <div>
                        <span className="font-bold text-sm text-foreground block">
                          {num.phoneNumber}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {num.countryName} • {num.type.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <Badge variant="pill" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Active Line
                    </Badge>
                  </div>

                  {/* Capabilities & Forwarding indicators */}
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>Monthly Rental:</span>
                      <span className="font-semibold text-foreground font-mono">
                        ⚡ {num.monthlyPriceCredits} Credits / mo
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>Forwarding to:</span>
                      <span className="font-medium text-foreground">
                        {num.forwardToPhone || num.forwardToEmail || "None (Browser Inbox)"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>Renews on:</span>
                      <span className="text-foreground">
                        {new Date(num.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/dashboard/inbox?numberId=${num.id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-8 px-2.5 gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-primary" />
                          <span>SMS Inbox</span>
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSettings(num)}
                        className="text-xs h-8 px-2.5 gap-1.5"
                      >
                        <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Configure</span>
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCancelNumber(num.id)}
                      className="text-[11px] text-destructive hover:underline"
                    >
                      Cancel Line
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENT NUMBER CONFIRMATION MODAL */}
      {numberToRent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Confirm Number Rental</h3>
                <p className="text-xs text-muted-foreground">Blacktel Virtual Telecommunications</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-1.5">
              <span className="text-2xl">{numberToRent.countryFlag}</span>
              <div className="text-lg font-bold font-mono text-foreground">
                {numberToRent.phoneNumber}
              </div>
              <span className="text-xs text-muted-foreground block">
                {numberToRent.countryName} ({numberToRent.type.replace("_", " ")})
              </span>
            </div>

            <div className="text-xs space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Monthly Rental Fee:</span>
                <span className="font-bold text-foreground font-mono">
                  ⚡ {numberToRent.monthlyPriceCredits} Credits
                </span>
              </div>
              <div className="flex justify-between">
                <span>Current Wallet Balance:</span>
                <span className="font-bold text-amber-500 font-mono">
                  ⚡ {walletBalance} Credits
                </span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-2 font-semibold">
                <span>Remaining After Rental:</span>
                <span className="text-foreground font-mono">
                  ⚡ {walletBalance - numberToRent.monthlyPriceCredits} Credits
                </span>
              </div>
            </div>

            {rentError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                {rentError}
              </div>
            )}

            {rentSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{rentSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setNumberToRent(null)}>
                Cancel
              </Button>
              <Button
                variant="glow"
                size="sm"
                disabled={isRenting}
                onClick={handleConfirmRent}
                className="gap-1.5"
              >
                {isRenting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Activating Line...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    Confirm & Rent
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURATION DRAWER / MODAL */}
      {configuredNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Configure {configuredNumber.phoneNumber}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Call forwarding, email notifications, and auto-reply rules
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfiguredNumber(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              {/* Forward to phone */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Forward Incoming Calls & SMS to Mobile Handset
                </label>
                <input
                  type="text"
                  placeholder="+1 (415) 555-0100"
                  value={forwardPhone}
                  onChange={(e) => setForwardPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border font-mono text-foreground"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Incoming calls or SMS will be seamlessly forwarded to your personal phone.
                </span>
              </div>

              {/* Forward to email */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  SMS to Email Forwarding
                </label>
                <input
                  type="email"
                  placeholder="your.email@company.com"
                  value={forwardEmail}
                  onChange={(e) => setForwardEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Receive full transcripts and OTPs straight to your email inbox.
                </span>
              </div>

              {/* Auto-reply */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Automated SMS Reply Bot
                </label>
                <textarea
                  rows={2}
                  placeholder="Thanks for reaching out! We received your message..."
                  value={autoReply}
                  onChange={(e) => setAutoReply(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Sent automatically when an inbound SMS is received on this line.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
                <Button variant="outline" size="sm" type="button" onClick={() => setConfiguredNumber(null)}>
                  Cancel
                </Button>
                <Button variant="glow" size="sm" type="submit" disabled={isSavingSettings}>
                  {isSavingSettings ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WALLET TOP-UP MODAL */}
      <WalletTopupModal
        isOpen={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        currentBalance={walletBalance}
        onSuccess={(newBal) => setWalletBalance(newBal)}
      />
    </div>
  );
}
