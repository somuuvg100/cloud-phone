import { createClient } from "@/lib/supabase/client";
import { AuditSeverity, Json } from "@/types/database";

export interface SecurityAuditEvent {
  userId?: string | null;
  eventType: string;
  severity: AuditSeverity;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, any>;
}

export interface InMemoryAuditEntry {
  id: string;
  user_id: string | null;
  event_type: string;
  severity: AuditSeverity;
  ip_address: string | null;
  user_agent: string | null;
  details: Json;
  created_at: string;
}

// In-memory ring buffer (up to 200 events) for real-time dashboard inspection
const localAuditLogs: InMemoryAuditEntry[] = [
  {
    id: "log_init_01",
    user_id: "usr_reachout_demo_9921",
    event_type: "SYSTEM_INITIALIZED",
    severity: "info",
    ip_address: "127.0.0.1",
    user_agent: "ReachOut Platform Engine/2.0",
    details: { message: "Security subsystem and RLS isolation active" },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "log_init_02",
    user_id: "usr_reachout_demo_9921",
    event_type: "RATE_LIMIT_POLICY_ACTIVE",
    severity: "info",
    ip_address: "127.0.0.1",
    user_agent: "Security Middleware",
    details: { window_seconds: 60, max_requests: 20 },
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

/**
 * Logs a security audit event asynchronously. Never throws or halts the caller thread.
 */
export async function logSecurityEvent(event: SecurityAuditEvent): Promise<void> {
  const timestamp = new Date().toISOString();
  const entryId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const logEntry: InMemoryAuditEntry = {
    id: entryId,
    user_id: event.userId || null,
    event_type: event.eventType,
    severity: event.severity,
    ip_address: event.ipAddress || null,
    user_agent: event.userAgent || null,
    details: (event.details as Json) || {},
    created_at: timestamp,
  };

  // Add to local ring buffer
  localAuditLogs.unshift(logEntry);
  if (localAuditLogs.length > 200) {
    localAuditLogs.pop();
  }

  // Persist to Supabase if available
  try {
    const supabase = createClient();
    await supabase.from("security_audit_logs").insert({
      user_id: event.userId || null,
      event_type: event.eventType,
      severity: event.severity,
      ip_address: event.ipAddress || null,
      user_agent: event.userAgent || null,
      details: (event.details as Json) || {},
      created_at: timestamp,
    });
  } catch (err) {
    // Non-fatal: local audit buffer retains event
    if (process.env.NODE_ENV === "development") {
      console.log(`[Security Audit] ${event.severity.toUpperCase()} - ${event.eventType}`, event.details);
    }
  }
}

/**
 * Returns recent in-memory audit logs (useful for fallback and UI demonstration).
 */
export function getLocalAuditLogs(userId?: string, limit = 50): InMemoryAuditEntry[] {
  let logs = localAuditLogs;
  if (userId) {
    logs = logs.filter((l) => !l.user_id || l.user_id === userId);
  }
  return logs.slice(0, limit);
}

