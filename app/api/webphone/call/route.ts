import { NextResponse, type NextRequest } from "next/server";
import { getCallLogs, logCallCompletion } from "@/services/webphone";
import { validateCsrfOrigin } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    const logs = getCallLogs();
    return NextResponse.json({ calls: logs }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to query call logs" },
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
    if (!body || !body.fromNumber || !body.toNumber) {
      return NextResponse.json(
        { error: "fromNumber and toNumber are required" },
        { status: 400 }
      );
    }

    const newLog = logCallCompletion(
      body.virtualNumberId || "vn_reachout_us_01",
      body.fromNumber,
      body.toNumber,
      body.durationSeconds || 0,
      body.status || "completed"
    );

    return NextResponse.json(
      {
        success: true,
        call: newLog,
        message: "Call session logged.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to log call" },
      { status: 500 }
    );
  }
}

