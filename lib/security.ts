import { type NextRequest } from "next/server";
import crypto from "crypto";

// ==============================================================================
// 1. INPUT SANITIZATION
// ==============================================================================

/**
 * Sanitizes message text by stripping harmful HTML/scripts, removing invisible
 * zero-width evasion characters, normalizing whitespace, and blocking control characters.
 */
export function sanitizeMessageText(input: string): string {
  if (!input) return "";

  let cleaned = input;

  // 1. Remove dangerous script and HTML tags
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  cleaned = cleaned.replace(/<[^>]+>/g, ""); // strip remaining HTML tags

  // 2. Strip invisible zero-width characters used in spam evasion & character stuffing
  // \u200B (zero-width space), \u200C (zero-width non-joiner), \u200D (zero-width joiner),
  // \u2060 (word joiner), \uFEFF (zero-width no-break space / BOM)
  cleaned = cleaned.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");

  // 3. Normalize Unicode non-breaking spaces and unusual whitespace to standard ASCII space
  cleaned = cleaned.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ");

  // 4. Strip non-printable ASCII control characters (keep \r, \n, \t)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 5. Replace excessive consecutive newlines (max 2 consecutive newlines)
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

/**
 * Sanitizes phone numbers by stripping homoglyphs, non-numeric characters (except leading +),
 * and normalizing fullwidth numerals to standard ASCII.
 */
export function sanitizePhoneNumber(input: string): string {
  if (!input) return "";

  // Normalize fullwidth Unicode numbers (e.g. １２３ -> 123)
  const normalized = input.normalize("NFKC");

  // Keep only '+' at the beginning and numeric digits
  const hasLeadingPlus = normalized.trim().startsWith("+");
  const digitsOnly = normalized.replace(/\D/g, "");

  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Sanitizes general user inputs (names, feedback, descriptions) to prevent XSS.
 */
export function sanitizeGeneralText(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>?/gm, "")
    .replace(/javascript:/gi, "")
    .trim();
}

// ==============================================================================
// 2. CSRF ORIGIN VALIDATION
// ==============================================================================

/**
 * Validates request Origin or Referer against expected application origins.
 * Protects state-changing API endpoints from cross-site request forgery.
 */
export function validateCsrfOrigin(request: NextRequest): { valid: boolean; reason?: string } {
  // Allow safe HTTP methods without CSRF verification
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return { valid: true };
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // Webhooks from external providers (e.g. Twilio) have their own cryptographic signatures
  // and are handled via HMAC signature verification.
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/webhooks/")) {
    return { valid: true };
  }

  // If both origin and referer are missing in a non-webhook API POST, examine sec-fetch-site
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return { valid: false, reason: "Cross-site request blocked by CSRF policy" };
  }

  const sourceUrl = origin || referer;
  if (!sourceUrl && process.env.NODE_ENV === "production") {
    // In production, require at least an Origin or Referer header for state mutations
    return { valid: false, reason: "Missing Origin or Referer header" };
  }

  if (sourceUrl) {
    try {
      const parsedSource = new URL(sourceUrl);
      const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

      // Allow same host
      if (host && (parsedSource.host === host || parsedSource.host.split(":")[0] === host.split(":")[0])) {
        return { valid: true };
      }

      // Allow configured site URL
      if (configuredSiteUrl) {
        const parsedConfig = new URL(configuredSiteUrl);
        if (parsedSource.host === parsedConfig.host) {
          return { valid: true };
        }
      }

      // Allow localhost in development
      if (
        parsedSource.hostname === "localhost" ||
        parsedSource.hostname === "127.0.0.1" ||
        parsedSource.hostname.endsWith(".vercel.app")
      ) {
        return { valid: true };
      }

      return {
        valid: false,
        reason: `Untrusted request origin: ${parsedSource.origin}`,
      };
    } catch {
      return { valid: false, reason: "Malformed Origin/Referer header" };
    }
  }

  return { valid: true };
}

// ==============================================================================
// 3. REPEATED UNWANTED MESSAGES / HARASSMENT PREVENTION
// ==============================================================================

interface RecipientDispatchTracker {
  timestamps: number[];
}

// In-memory sliding window: tracks dispatches per (user_id + recipient_phone)
const harassmentTracker = new Map<string, RecipientDispatchTracker>();

/**
 * Enforces recipient protection against rapid harassment bombing:
 * Maximum 3 messages to the EXACT SAME destination number within a 10-minute window
 * per sending user account.
 */
export function checkRepeatedMessageHarassment(
  userId: string,
  recipientPhone: string,
  maxPerWindow = 3,
  windowMinutes = 10
): { allowed: boolean; retryAfterSeconds?: number; reason?: string } {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const key = `${userId}:${recipientPhone.replace(/\D/g, "")}`;

  let record = harassmentTracker.get(key);
  if (!record) {
    record = { timestamps: [] };
    harassmentTracker.set(key, record);
  }

  // Filter out timestamps outside the active sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= maxPerWindow) {
    const oldest = record.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
      reason: `Anti-Harassment Protection: Maximum of ${maxPerWindow} messages to the same recipient permitted every ${windowMinutes} minutes. Please wait before messaging this number again.`,
    };
  }

  record.timestamps.push(now);
  return { allowed: true };
}

// ==============================================================================
// 4. SUSPICIOUS ACTIVITY & CAPTCHA / SECURITY CHALLENGE
// ==============================================================================

// Dynamic memory challenge storage
const activeChallenges = new Map<
  string,
  { answer: string; expiresAt: number; challengeType: string }
>();

const SECRET_SALT = process.env.TWILIO_AUTH_TOKEN || "reachout_security_salt_2026";

/**
 * Creates a verification challenge for elevated-risk actions or rapid dispatch.
 */
export function createSecurityChallenge(): {
  challengeId: string;
  prompt: string;
  token: string;
  expiresInSeconds: number;
} {
  const challengeId = `ch_${crypto.randomBytes(8).toString("hex")}`;
  const num1 = Math.floor(Math.random() * 8) + 2;
  const num2 = Math.floor(Math.random() * 7) + 1;
  const answer = String(num1 + num2);
  const prompt = `Security Verification: What is ${num1} + ${num2}?`;

  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute validity
  activeChallenges.set(challengeId, { answer, expiresAt, challengeType: "math" });

  // Cryptographic token
  const token = crypto
    .createHmac("sha256", SECRET_SALT)
    .update(`${challengeId}:${answer}:${expiresAt}`)
    .digest("hex");

  return {
    challengeId,
    prompt,
    token: `${token}:${expiresAt}`,
    expiresInSeconds: 300,
  };
}

/**
 * Validates a solved security challenge.
 */
export function verifySecurityChallenge(
  challengeId: string,
  userAnswer: string,
  tokenWithExpiry?: string
): { valid: boolean; reason?: string } {
  const stored = activeChallenges.get(challengeId);
  const now = Date.now();

  if (!stored) {
    return { valid: false, reason: "Security challenge expired or not found. Please refresh." };
  }

  if (now > stored.expiresAt) {
    activeChallenges.delete(challengeId);
    return { valid: false, reason: "Security challenge has expired." };
  }

  const cleanUserAnswer = String(userAnswer || "").trim();
  if (cleanUserAnswer !== stored.answer) {
    return { valid: false, reason: "Incorrect security challenge answer." };
  }

  // Once solved, consume challenge to prevent replay
  activeChallenges.delete(challengeId);
  return { valid: true };
}

// ==============================================================================
// 5. LOCAL SUPPRESSION CACHE (Fallback / In-Memory Mock)
// ==============================================================================

const localSuppressedNumbers = new Map<
  string,
  { reason: string; source: string; timestamp: string }
>();

// Seed with demonstration opted-out recipient
localSuppressedNumbers.set("+14155550199", {
  reason: "stop_keyword",
  source: "carrier_inbound_sms",
  timestamp: new Date().toISOString(),
});

export function isLocalSuppressed(phone: string): boolean {
  const normalized = sanitizePhoneNumber(phone);
  return localSuppressedNumbers.has(normalized);
}

export function addLocalSuppression(phone: string, reason: string, source = "manual") {
  const normalized = sanitizePhoneNumber(phone);
  localSuppressedNumbers.set(normalized, {
    reason,
    source,
    timestamp: new Date().toISOString(),
  });
}

export function removeLocalSuppression(phone: string) {
  const normalized = sanitizePhoneNumber(phone);
  localSuppressedNumbers.delete(normalized);
}

export function getLocalSuppressionList() {
  return Array.from(localSuppressedNumbers.entries()).map(([phone, data]) => ({
    id: `sup_${phone.replace(/\D/g, "")}`,
    recipient_phone: phone,
    reason: data.reason as any,
    source: data.source,
    user_id: null,
    created_at: data.timestamp,
  }));
}

