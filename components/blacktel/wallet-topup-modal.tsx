"use client";

import * as React from "react";
import {
  Zap,
  CreditCard,
  Coins,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditPackage, WalletBalance } from "@/types/blacktel";
import { CREDIT_PACKAGES } from "@/services/wallet";

interface WalletTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
  onSuccess?: (newBalance: number) => void;
}

export function WalletTopupModal({
  isOpen,
  onClose,
  currentBalance = 120,
  onSuccess,
}: WalletTopupModalProps) {
  const [selectedPkgId, setSelectedPkgId] = React.useState<string>("pkg_popular");
  const [paymentMethod, setPaymentMethod] = React.useState<"card" | "crypto" | "apple_pay">("card");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [successNotice, setSuccessNotice] = React.useState<string | null>(null);
  const [errorNotice, setErrorNotice] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleTopup = async () => {
    setIsProcessing(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPkgId,
          paymentMethod: paymentMethod === "crypto" ? "Bitcoin / Crypto" : "Card Checkout",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Top-up failed");

      setSuccessNotice(data.message || "Credits added successfully!");
      if (onSuccess && data.wallet) {
        onSuccess(data.wallet.credits);
      }
      setTimeout(() => {
        onClose();
        setSuccessNotice(null);
      }, 1500);
    } catch (err: any) {
      setErrorNotice(err.message || "An error occurred during payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Zap className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-foreground">Top-Up Credit Wallet</h3>
                <Badge variant="pill" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                  ⚡ {currentBalance} Credits
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Blacktel prepaid credits for virtual numbers, SMS, and browser calls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Packages Grid */}
        <div className="mt-4 space-y-3">
          <label className="text-xs font-semibold text-foreground block">
            Select Credit Package
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CREDIT_PACKAGES.map((pkg) => {
              const isSelected = selectedPkgId === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`relative p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "border-amber-500/80 bg-amber-500/5 shadow-md shadow-amber-500/10"
                      : "border-border/80 hover:border-border bg-muted/30"
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 right-3 text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                      Best Value
                    </span>
                  )}
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-base text-foreground flex items-center gap-1">
                      ⚡ {pkg.credits}
                      {pkg.bonusCredits && (
                        <span className="text-xs text-emerald-500 font-semibold">
                          +{pkg.bonusCredits} Bonus
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-bold font-mono text-foreground">
                      ${pkg.priceUsd.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {pkg.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-foreground block">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { id: "card", label: "Credit Card", icon: CreditCard },
              { id: "crypto", label: "Crypto / BTC", icon: Coins },
              { id: "apple_pay", label: "Apple / GPay", icon: Sparkles },
            ].map((method) => {
              const isSel = paymentMethod === method.id;
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    isSel
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 hover:border-border text-muted-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notices */}
        {successNotice && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {errorNotice && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 flex items-center justify-between border-t border-border/60">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-bit Encrypted Checkout</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="glow"
              size="sm"
              disabled={isProcessing}
              onClick={handleTopup}
              className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md shadow-amber-500/20"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  Add Credits Now
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

