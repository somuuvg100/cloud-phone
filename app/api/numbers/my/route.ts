import { NextResponse, type NextRequest } from "next/server";
import {
  getUserVirtualNumbers,
  updateVirtualNumberSettings,
  cancelVirtualNumber,
} from "@/services/virtual-numbers";
import { validateCsrfOrigin } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    const numbers = getUserVirtualNumbers();
    return NextResponse.json({ numbers }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to query active virtual numbers" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const csrf = validateCsrfOrigin(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: csrf.reason }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.numberId) {
      return NextResponse.json(
        { error: "Missing required numberId" },
        { status: 400 }
      );
    }

    const updated = updateVirtualNumberSettings(body.numberId, {
      autoRenew: body.autoRenew,
      forwardToPhone: body.forwardToPhone,
      forwardToEmail: body.forwardToEmail,
      autoReplyText: body.autoReplyText,
    });

    if (!updated.success) {
      return NextResponse.json({ error: updated.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        number: updated.number,
        message: "Virtual number configuration updated successfully.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update virtual number" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const csrf = validateCsrfOrigin(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: csrf.reason }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.numberId) {
      return NextResponse.json(
        { error: "Missing required numberId" },
        { status: 400 }
      );
    }

    const canceled = cancelVirtualNumber(body.numberId);
    return NextResponse.json(
      {
        success: canceled,
        message: canceled
          ? "Virtual number canceled."
          : "Number was not found or already canceled.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to cancel virtual number" },
      { status: 500 }
    );
  }
}

