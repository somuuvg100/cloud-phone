import { NextResponse, type NextRequest } from "next/server";
import {
  getUserWallet,
  CREDIT_PACKAGES,
  getWalletTransactions,
  topupCredits,
} from "@/services/wallet";
import { validateCsrfOrigin } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    const wallet = getUserWallet();
    const transactions = getWalletTransactions();
    return NextResponse.json(
      {
        wallet,
        packages: CREDIT_PACKAGES,
        transactions,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to query wallet details" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrf = validateCsrfOrigin(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: csrf.reason }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.packageId) {
      return NextResponse.json(
        { error: "Missing required packageId for top-up" },
        { status: 400 }
      );
    }

    const result = topupCredits(
      undefined,
      body.packageId,
      body.paymentMethod || "Credit Card / Crypto"
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const updatedWallet = getUserWallet();

    return NextResponse.json(
      {
        success: true,
        wallet: updatedWallet,
        message: "Credits added to wallet successfully!",
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process wallet top-up" },
      { status: 500 }
    );
  }
}

