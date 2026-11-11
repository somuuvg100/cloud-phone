import { NextResponse, type NextRequest } from "next/server";
import { AVAILABLE_NUMBERS_CATALOG } from "@/services/virtual-numbers";
import { VirtualNumberType } from "@/types/blacktel";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const type = searchParams.get("type") as VirtualNumberType | null;
    const capability = searchParams.get("capability");

    let results = AVAILABLE_NUMBERS_CATALOG;

    if (country && country !== "all") {
      results = results.filter(
        (n) => n.countryCode.toLowerCase() === country.toLowerCase()
      );
    }

    if (type && type !== ("all" as any)) {
      results = results.filter((n) => n.type === type);
    }

    if (capability && capability !== "all") {
      results = results.filter((n) => (n.capabilities as string[]).includes(capability));
    }

    return NextResponse.json({ numbers: results }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to query available numbers" },
      { status: 500 }
    );
  }
}

