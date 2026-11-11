import { NextResponse, type NextRequest } from "next/server";
import {
  createSecurityChallenge,
  verifySecurityChallenge,
  validateCsrfOrigin,
} from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logSecurityEvent } from "@/lib/audit-logger";

export async function GET(request: NextRequest) {
  try {
    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimit = checkRateLimit(`challenge_gen:${clientIp}`, 15, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many security challenge requests. Please wait." },
        { status: 429 }
      );
    }

    const challenge = createSecurityChallenge();

    await logSecurityEvent({
      eventType: "SECURITY_CHALLENGE_ISSUED",
      severity: "info",
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
      details: { challengeId: challenge.challengeId },
    });

    return NextResponse.json(challenge, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate security challenge" },
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

    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await request.json().catch(() => null);

    if (!body || !body.challengeId || body.answer === undefined) {
      return NextResponse.json(
        { error: "Missing required challenge verification parameters" },
        { status: 400 }
      );
    }

    const { challengeId, answer, token } = body;
    const result = verifySecurityChallenge(challengeId, String(answer), token);

    if (!result.valid) {
      await logSecurityEvent({
        eventType: "SECURITY_CHALLENGE_FAILED",
        severity: "warn",
        ipAddress: clientIp,
        userAgent: request.headers.get("user-agent"),
        details: { challengeId, reason: result.reason },
      });

      return NextResponse.json(
        { verified: false, error: result.reason || "Incorrect challenge solution" },
        { status: 400 }
      );
    }

    await logSecurityEvent({
      eventType: "SECURITY_CHALLENGE_SOLVED",
      severity: "info",
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
      details: { challengeId },
    });

    return NextResponse.json(
      {
        verified: true,
        verificationProof: `proof_${challengeId}_${Date.now()}`,
        message: "Human verification passed successfully",
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Verification failed" },
      { status: 500 }
    );
  }
}

