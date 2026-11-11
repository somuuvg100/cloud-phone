interface RateLimitRecord {
  timestamps: number[];
}

interface IdempotencyRecord {
  result: any;
  timestamp: number;
}

// In-memory sliding window rate limiter (per user ID or IP)
const rateLimitMap = new Map<string, RateLimitRecord>();

// In-memory idempotency cache (stores response for 60 seconds)
const idempotencyMap = new Map<string, IdempotencyRecord>();

// In-memory duplicate request hash tracker
const recentRequestsMap = new Map<string, number>();

/**
 * Checks sliding window rate limit
 * @param identifier User ID or IP
 * @param maxRequests Maximum requests allowed in window (default 10)
 * @param windowSeconds Window duration in seconds (default 60)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowSeconds = 60
): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let record = rateLimitMap.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(identifier, record);
  }

  // Filter timestamps within the current sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
  };
}

/**
 * Checks for duplicate request using an idempotency key or content hash
 */
export function checkDuplicateRequest(
  key: string,
  ttlSeconds = 60
): { isDuplicate: boolean; cachedResult?: any } {
  const now = Date.now();
  const cached = idempotencyMap.get(key);

  if (cached) {
    if (now - cached.timestamp < ttlSeconds * 1000) {
      return { isDuplicate: true, cachedResult: cached.result };
    }
    idempotencyMap.delete(key);
  }

  // Check recent identical request hash within 10 seconds to stop rapid double-clicks
  const lastAttempt = recentRequestsMap.get(key);
  if (lastAttempt && now - lastAttempt < 10000) {
    return { isDuplicate: true };
  }

  recentRequestsMap.set(key, now);

  return { isDuplicate: false };
}

/**
 * Caches an idempotency result
 */
export function saveIdempotencyResult(key: string, result: any) {
  idempotencyMap.set(key, {
    result,
    timestamp: Date.now(),
  });
}

/**
 * Simple abuse and harassment content scanner
 */
export function checkContentSafety(text: string): { safe: boolean; reason?: string } {
  if (!text || !text.trim()) {
    return { safe: false, reason: "Message content cannot be empty" };
  }

  if (text.length > 1600) {
    return { safe: false, reason: "Message exceeds maximum length of 1600 characters" };
  }

  // Block obvious spam patterns
  const repetitiveChar = /(.)\1{40,}/;
  if (repetitiveChar.test(text)) {
    return { safe: false, reason: "Message contains suspicious repetitive character sequence" };
  }

  return { safe: true };
}

