import { NextResponse, type NextRequest } from "next/server";
import {
  AVAILABLE_NUMBERS_CATALOG,
  rentVirtualNumber,
} from "@/services/virtual-numbers";
import { deductCredits } from "@/services/wallet";
import { validateCsrfOrigin } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const csrf = validateCsrfOrigin(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: csrf.reason }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required to rent a virtual number." },
        { status: 400 }
      );
    }

    const catalogItem = AVAILABLE_NUMBERS_CATALOG.find(
      (n) => n.phoneNumber === body.phoneNumber
    );

    if (!catalogItem) {
      return NextResponse.json(
        { error: "Requested phone number is not available in catalog." },
        { status: 404 }
      );
    }

    // Deduct credits for monthly rental
    const deductResult = deductCredits(
      undefined,
      catalogItem.monthlyPriceCredits,
      "number_rental",
      `Monthly rental for ${catalogItem.countryName} ${catalogItem.phoneNumber}`
    );

    if (!deductResult.success) {
      return NextResponse.json(
        {
          error: deductResult.error,
          requiredCredits: catalogItem.monthlyPriceCredits,
        },
        { status: 402 }
      );
    }

    // Rent the number
    const rentResult = rentVirtualNumber(body.phoneNumber);
    if (!rentResult.success) {
      return NextResponse.json(
        { error: rentResult.error || "Failed to activate virtual number." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        number: rentResult.number,
        newBalance: deductResult.newBalance,
        message: `Successfully rented ${catalogItem.phoneNumber}! It is now active and ready to make calls and receive SMS.`,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process number rental." },
      { status: 500 }
    );
  }
}

