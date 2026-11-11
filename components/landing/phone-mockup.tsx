"use client";

import * as React from "react";
import {
  Send,
  CheckCheck,
  ShieldCheck,
  Globe2,
  Sparkles,
  Signal,
  Wifi,
  Battery,
  ChevronDown,
  Info,
  Clock,
  Zap,
  Search,
} from "lucide-react";
import { COUNTRIES, CountryData } from "@/lib/countries";
import { formatAsYouType, validateAndFormatPhone } from "@/lib/phone-utils";

export function PhoneMockup() {
  const [selectedCountry, setSelectedCountry] = React.useState<CountryData>(
    COUNTRIES[0] // India (+91)
  );
  const [phoneNumber, setPhoneNumber] = React.useState("98765 43210");
  const [showCountryMenu, setShowCountryMenu] = React.useState(false);
  const [countrySearch, setCountrySearch] = React.useState("");
  const [messageInput, setMessageInput] = React.useState(
    "Hi Sarah! Your appointment at ReachOut Studio is confirmed for tomorrow at 10:00 AM. Reply STOP to cancel."
  );
  const [messages, setMessages] = React.useState([
    {
      id: "1",
      sender: "system",
      text: "👋 Welcome to ReachOut. Tier-1 SMS routing established with direct carrier interconnect.",
      time: "10:41 AM",
      status: "delivered",
    },
    {
      id: "2",
      sender: "user",
      text: "Hi Sarah! Your appointment at ReachOut Studio is confirmed for tomorrow at 10:00 AM. Reply STOP to cancel.",
      time: "10:42 AM",
      status: "delivered",
    },
  ]);
  const [isSending, setIsSending] = React.useState(false);

  const phoneValidation = React.useMemo(() => {
    return validateAndFormatPhone(
      phoneNumber,
      selectedCountry.code,
      selectedCountry.dialCode
    );
  }, [phoneNumber, selectedCountry]);

  const handleSend = () => {
    if (!messageInput.trim() || isSending) return;

    const newMessageId = Date.now().toString();
    const newMsg = {
      id: newMessageId,
      sender: "user",
      text: messageInput.trim(),
      time: "Just now",
      status: "sending",
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessageInput("");
    setIsSending(true);

    // Simulate instant carrier routing & delivery update
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === newMessageId ? { ...m, status: "delivered", time: "Just now" } : m
        )
      );
      setIsSending(false);
    }, 1200);
  };

  return (
    <div className="relative mx-auto w-full max-w-[420px] lg:max-w-[460px]">
      {/* Decorative Glow Behind Device */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20 rounded-[3rem] blur-2xl -z-10 animate-pulseGlow" />

      {/* Floating Widget Top-Left: Carrier Telemetry */}
      <div className="absolute -top-6 -left-6 z-20 hidden sm:flex items-center gap-3 p-3 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-xl shadow-black/5 animate-float">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Average Latency
          </div>
          <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
            1.2s Global Delivery
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
        </div>
      </div>

      {/* Floating Widget Bottom-Right: Compliance & Opt-in */}
      <div className="absolute -bottom-6 -right-6 z-20 hidden sm:flex items-center gap-3 p-3 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-xl shadow-black/5 animate-float-slow">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            TCPA & GDPR Verified
          </div>
          <div className="text-sm font-bold text-foreground">
            100% Consent-Compliant
          </div>
        </div>
      </div>

      {/* Phone Hardware Mockup */}
      <div className="relative rounded-[2.8rem] p-3.5 bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 shadow-2xl border border-white/40 dark:border-slate-800/80 ring-1 ring-black/5 dark:ring-white/10">
        {/* Inner Phone Screen */}
        <div className="relative rounded-[2.2rem] bg-background border border-border/60 overflow-hidden flex flex-col h-[650px] shadow-inner">

          {/* Status Bar */}
          <div className="px-6 pt-3 pb-2 flex items-center justify-between text-xs text-muted-foreground select-none">
            <span className="font-semibold text-foreground">9:41</span>

            {/* Dynamic Island / Speaker Notch */}
            <div className="w-24 h-4 bg-slate-900 dark:bg-black rounded-full flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500/80 animate-pulse" />
            </div>

            <div className="flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* Interactive Phone Header with Country & Contact */}
          <div className="px-4 py-3 bg-muted/30 border-b border-border/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {selectedCountry.flag}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    Sarah Jenkins
                    <span className="text-[10px] font-normal text-muted-foreground px-1.5 py-0.2 rounded bg-muted">
                      Opted-in
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span>{selectedCountry.dialCode} {phoneNumber}</span>
                    <span className="text-emerald-500 font-medium">• Carrier Ready</span>
                  </div>
                </div>
              </div>

              {/* Country Selector Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCountryMenu(!showCountryMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-background border border-border hover:bg-muted/80 transition-colors shadow-sm"
                >
                  <span className="text-sm">{selectedCountry.flag}</span>
                  <span className="font-mono text-[11px]">{selectedCountry.dialCode}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>

                {/* Dropdown Menu */}
                {showCountryMenu && (
                  <div className="absolute right-0 mt-1 w-60 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl z-50 p-2 max-h-64 flex flex-col">
                    <div className="relative mb-2">
                      <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search country or code..."
                        className="w-full pl-6 pr-2 py-1 text-[11px] rounded-lg bg-muted/60 border border-border text-foreground focus:outline-none"
                      />
                    </div>
                    <div className="overflow-y-auto space-y-0.5 max-h-48">
                      {COUNTRIES.filter(
                        (c) =>
                          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                          c.dialCode.includes(countrySearch)
                      ).map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowCountryMenu(false);
                            setPhoneNumber(country.example);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs hover:bg-accent text-left transition-colors ${country.code === selectedCountry.code ? "bg-accent font-semibold" : ""
                            }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span>{country.flag}</span>
                            <span className="truncate max-w-[120px]">{country.name}</span>
                          </div>
                          <span className="text-muted-foreground font-mono text-[10px]">
                            {country.dialCode}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Carrier SLA status pill */}
            <div className="flex items-center justify-between text-[10px] px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
              <span className="flex items-center gap-1 font-medium">
                <Globe2 className="w-3 h-3 text-blue-500" />
                Twilio Global Interconnect
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                100% Delivery SLA
              </span>
            </div>
          </div>

          {/* Conversation Screen */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-background to-muted/20">
            {/* Timestamp */}
            <div className="flex justify-center">
              <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted/60">
                Today 10:41 AM • International SMS
              </span>
            </div>

            {/* Consent Banner */}
            <div className="mx-auto max-w-[280px] p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Explicit Opt-in Consent Logged
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                Token #OPT-{selectedCountry.code}-2026 • Unsubscribe keywords supported
              </div>
            </div>

            {/* Message Bubbles */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"
                  }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${msg.sender === "user"
                      ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-xs"
                      : "bg-muted text-foreground border border-border/80 rounded-bl-xs"
                    }`}
                >
                  {msg.text}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 px-1">
                  <span>{msg.time}</span>
                  {msg.sender === "user" && (
                    <span className="flex items-center gap-0.5 text-blue-500 dark:text-blue-400">
                      {msg.status === "sending" ? (
                        <Clock className="w-3 h-3 animate-spin text-amber-500" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                      )}
                      <span className="text-[9px] capitalize">
                        {msg.status === "sending" ? "Routing..." : "Delivered"}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Input Bar */}
          <div className="p-3 bg-background border-t border-border/80 space-y-2">
            {/* Quick Canned Suggestions */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              <button
                type="button"
                onClick={() =>
                  setMessageInput("Your 6-digit ReachOut verification code is 492-810.")
                }
                className="whitespace-nowrap px-2 py-0.5 rounded-full bg-muted hover:bg-accent text-muted-foreground text-[10px] border border-border transition-colors"
              >
                🔑 2FA Verification
              </button>
              <button
                type="button"
                onClick={() =>
                  setMessageInput(
                    "Order #RO-8819 is out for delivery! Track your courier live here."
                  )
                }
                className="whitespace-nowrap px-2 py-0.5 rounded-full bg-muted hover:bg-accent text-muted-foreground text-[10px] border border-border transition-colors"
              >
                📦 Delivery Alert
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type SMS message..."
                className="flex-1 bg-muted/60 border border-border/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || isSending}
                className="h-8 w-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all disabled:opacity-40 active:scale-95 shadow-sm"
                aria-label="Send SMS"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
              <span>{messageInput.length} chars • 1 segment (GSM-7)</span>
              <span className="text-emerald-500 font-medium">Ready to dispatch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

