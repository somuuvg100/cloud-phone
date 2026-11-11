import { CreditPackage, WalletBalance, WalletTransaction } from "@/types/blacktel";

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "pkg_starter",
    credits: 50,
    priceUsd: 5.0,
    description: "Great for testing 1 virtual number & ~50 SMS",
  },
  {
    id: "pkg_popular",
    credits: 120,
    priceUsd: 10.0,
    popular: true,
    bonusCredits: 10,
    description: "Includes 2 active numbers, 100+ SMS & browser calling",
  },
  {
    id: "pkg_pro",
    credits: 300,
    priceUsd: 25.0,
    bonusCredits: 35,
    description: "Multiple international numbers, WhatsApp SIMs & call forwarding",
  },
  {
    id: "pkg_enterprise",
    credits: 750,
    priceUsd: 50.0,
    bonusCredits: 125,
    description: "High volume 2FA verification, team forwarding & call recording",
  },
];

// In-memory wallet balance per user (seeded with 120 credits for demo user)
const userWallets = new Map<string, number>();
userWallets.set("usr_reachout_demo_9921", 120);

// In-memory transaction history
const userTransactions: WalletTransaction[] = [
  {
    id: "tx_init_bonus",
    amountCredits: 120,
    type: "credit_topup",
    description: "Welcome trial package credited to account",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "tx_rent_us",
    amountCredits: -12,
    type: "number_rental",
    description: "Monthly rental for US Mobile +1 (415) 890-2314",
    referenceId: "vn_reachout_us_01",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "tx_rent_uk",
    amountCredits: -16,
    type: "number_rental",
    description: "Monthly rental for UK WhatsApp SIM +44 7911 123456",
    referenceId: "vn_reachout_uk_02",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export function getUserWallet(userId = "usr_reachout_demo_9921"): WalletBalance {
  const credits = userWallets.get(userId) ?? 120;
  return {
    credits,
    currency: "USD",
    usdEquivalent: parseFloat((credits * 0.0833).toFixed(2)),
    updatedAt: new Date().toISOString(),
  };
}

export function topupCredits(
  userId = "usr_reachout_demo_9921",
  packageId: string,
  paymentMethod = "credit_card"
): { success: boolean; newBalance?: number; error?: string } {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return { success: false, error: "Invalid credit package selected." };

  const totalCreditsToAdd = pkg.credits + (pkg.bonusCredits || 0);
  const current = userWallets.get(userId) ?? 120;
  const newBalance = current + totalCreditsToAdd;
  userWallets.set(userId, newBalance);

  const tx: WalletTransaction = {
    id: `tx_${Date.now()}`,
    amountCredits: totalCreditsToAdd,
    type: "credit_topup",
    description: `Top-up: ${pkg.credits} Credits${pkg.bonusCredits ? ` (+${pkg.bonusCredits} Bonus)` : ""} via ${paymentMethod}`,
    createdAt: new Date().toISOString(),
  };

  userTransactions.unshift(tx);
  return { success: true, newBalance };
}

export function deductCredits(
  userId = "usr_reachout_demo_9921",
  amount: number,
  type: WalletTransaction["type"],
  description: string,
  referenceId?: string
): { success: boolean; newBalance?: number; error?: string } {
  const current = userWallets.get(userId) ?? 120;
  if (current < amount) {
    return {
      success: false,
      error: `Insufficient credit balance. You have ${current} credits, but ${amount} credits are required. Please top up your wallet.`,
    };
  }

  const newBalance = current - amount;
  userWallets.set(userId, newBalance);

  const tx: WalletTransaction = {
    id: `tx_${Date.now()}`,
    amountCredits: -amount,
    type,
    description,
    referenceId,
    createdAt: new Date().toISOString(),
  };

  userTransactions.unshift(tx);
  return { success: true, newBalance };
}

export function getWalletTransactions(): WalletTransaction[] {
  return [...userTransactions];
}

