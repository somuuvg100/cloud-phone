import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  ProfileRow,
  ProfileUpdate,
  MessageRow,
  MessageInsert,
  MessagingPreferencesRow,
  ConsentRecordRow,
  ConsentStatusType,
  MessageStatusType,
  SuppressionRecordRow,
  SuppressionRecordInsert,
  SuppressionReasonType,
  AbuseReportRow,
  AbuseReportInsert,
  SecurityAuditLogRow,
  SecurityAuditLogInsert,
} from "@/types/database";
import {
  isLocalSuppressed,
  addLocalSuppression,
  removeLocalSuppression,
  getLocalSuppressionList,
  sanitizePhoneNumber,
} from "@/lib/security";
import { getLocalAuditLogs } from "@/lib/audit-logger";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// ==============================================================================
// 1. PROFILES SERVICE
// ==============================================================================

export async function getProfile(userId: string): Promise<ServiceResult<ProfileRow>> {
  if (!isSupabaseConfigured()) {
    // Return mock fallback in demo mode
    return {
      data: {
        id: userId,
        full_name: "Sarah Jenkins",
        email: "sarah@company.com",
        company_name: "Global Reach Solutions Ltd.",
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in getProfile:", err);
    return { data: null, error: err.message || "Failed to fetch user profile" };
  }
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<ServiceResult<ProfileRow>> {
  if (!isSupabaseConfigured()) {
    return {
      data: {
        id: userId,
        full_name: updates.full_name || "Sarah Jenkins",
        email: updates.email || "sarah@company.com",
        company_name: updates.company_name ?? null,
        avatar_url: updates.avatar_url ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in updateProfile:", err);
    return { data: null, error: err.message || "Failed to update profile" };
  }
}

// ==============================================================================
// 2. MESSAGES SERVICE
// ==============================================================================

export async function insertMessage(
  message: MessageInsert
): Promise<ServiceResult<MessageRow>> {
  if (!isSupabaseConfigured()) {
    // Mock record for local demo mode
    const mockRow: MessageRow = {
      id: message.id || `msg_mock_${Date.now()}`,
      user_id: message.user_id,
      recipient_phone: message.recipient_phone,
      recipient_country: message.recipient_country,
      message_body: message.message_body,
      provider_message_id: message.provider_message_id || `SM_${Date.now()}`,
      status: message.status || "queued",
      created_at: new Date().toISOString(),
      delivered_at: null,
      segments: message.segments || 1,
      cost_estimate: message.cost_estimate ?? 0.0079,
    };
    return { data: mockRow, error: null };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        ...message,
        status: message.status || "queued",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in insertMessage:", err);
    return { data: null, error: err.message || "Failed to log message in database" };
  }
}

export async function getUserMessages(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: MessageStatusType;
    searchQuery?: string;
  }
): Promise<ServiceResult<MessageRow[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    const supabase = createClient();
    let query = supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.searchQuery) {
      query = query.or(
        `recipient_phone.ilike.%${options.searchQuery}%,message_body.ilike.%${options.searchQuery}%`
      );
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err: any) {
    console.error("Error in getUserMessages:", err);
    return { data: null, error: err.message || "Failed to fetch user messages" };
  }
}

export async function deleteMessage(
  messageId: string,
  userId: string
): Promise<ServiceResult<boolean>> {
  if (!isSupabaseConfigured()) {
    return { data: true, error: null };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)
      .eq("user_id", userId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (err: any) {
    console.error("Error in deleteMessage:", err);
    return { data: false, error: err.message || "Failed to delete message" };
  }
}

export async function clearUserMessageHistory(
  userId: string,
  retentionDays?: number
): Promise<ServiceResult<boolean>> {
  if (!isSupabaseConfigured()) {
    return { data: true, error: null };
  }

  try {
    const supabase = createClient();
    let query = supabase.from("messages").delete().eq("user_id", userId);

    if (retentionDays && retentionDays > 0) {
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
      query = query.lt("created_at", cutoff);
    }

    const { error } = await query;
    if (error) throw error;
    return { data: true, error: null };
  } catch (err: any) {
    console.error("Error in clearUserMessageHistory:", err);
    return { data: false, error: err.message || "Failed to purge message history" };
  }
}

export async function updateMessageDelivery(
  providerMessageId: string,
  status: MessageStatusType,
  deliveredAt?: string
): Promise<ServiceResult<MessageRow>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .update({
        status,
        delivered_at: deliveredAt || (status === "delivered" ? new Date().toISOString() : null),
      })
      .eq("provider_message_id", providerMessageId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in updateMessageDelivery:", err);
    return { data: null, error: err.message || "Failed to update delivery status" };
  }
}

// ==============================================================================
// 3. MESSAGING PREFERENCES & DAILY ALLOWANCE SERVICE
// ==============================================================================

export async function getUserPreferences(
  userId: string
): Promise<ServiceResult<MessagingPreferencesRow>> {
  if (!isSupabaseConfigured()) {
    return {
      data: {
        id: `pref_${userId}`,
        user_id: userId,
        daily_limit: 1000,
        messages_sent_today: 780,
        last_reset_date: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messaging_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // Row not found yet, create default
      const { data: newRow, error: insertErr } = await supabase
        .from("messaging_preferences")
        .insert({
          user_id: userId,
          daily_limit: 1000,
          messages_sent_today: 0,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      return { data: newRow, error: null };
    }

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in getUserPreferences:", err);
    return { data: null, error: err.message || "Failed to fetch messaging preferences" };
  }
}

export async function updateMessagingPreferences(
  userId: string,
  updates: Partial<MessagingPreferencesRow>
): Promise<ServiceResult<MessagingPreferencesRow>> {
  if (!isSupabaseConfigured()) {
    return {
      data: {
        id: `pref_${userId}`,
        user_id: userId,
        daily_limit: updates.daily_limit || 1000,
        messages_sent_today: 780,
        last_reset_date: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messaging_preferences")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in updateMessagingPreferences:", err);
    return { data: null, error: err.message || "Failed to update preferences" };
  }
}

export async function recordMessageSentAndCheckAllowance(
  userId: string,
  segmentsCount = 1
): Promise<ServiceResult<{ remaining: number; allowed: boolean }>> {
  if (!isSupabaseConfigured()) {
    return { data: { remaining: 220 - segmentsCount, allowed: true }, error: null };
  }

  try {
    const supabase = createClient();

    // Call PostgreSQL stored procedure
    const { data, error } = await supabase.rpc("increment_message_count", {
      p_user_id: userId,
      p_count: segmentsCount,
    });

    if (error) {
      // Fallback manual query if stored procedure isn't installed yet
      const { data: prefs } = await getUserPreferences(userId);
      if (!prefs) return { data: { remaining: 1000, allowed: true }, error: null };

      const newSent = prefs.messages_sent_today + segmentsCount;
      await supabase
        .from("messaging_preferences")
        .update({ messages_sent_today: newSent })
        .eq("user_id", userId);

      const remaining = Math.max(0, prefs.daily_limit - newSent);
      return { data: { remaining, allowed: remaining >= 0 }, error: null };
    }

    const result = data?.[0] || { remaining: 999, sent_today: 1, daily_limit: 1000 };
    return {
      data: {
        remaining: result.remaining,
        allowed: result.remaining >= 0,
      },
      error: null,
    };
  } catch (err: any) {
    console.error("Error in recordMessageSentAndCheckAllowance:", err);
    return { data: { remaining: 100, allowed: true }, error: err.message };
  }
}

// ==============================================================================
// 4. CONSENT RECORDS SERVICE
// ==============================================================================

export async function recordConsent(
  userId: string,
  recipientPhone: string,
  status: ConsentStatusType = "opted_in",
  source = "web_portal"
): Promise<ServiceResult<ConsentRecordRow>> {
  if (!isSupabaseConfigured()) {
    return {
      data: {
        id: `consent_${Date.now()}`,
        user_id: userId,
        recipient_phone: recipientPhone,
        consent_status: status,
        consent_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        consent_source: source,
      },
      error: null,
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("consent_records")
      .upsert(
        {
          user_id: userId,
          recipient_phone: recipientPhone,
          consent_status: status,
          consent_timestamp: new Date().toISOString(),
          consent_source: source,
        },
        { onConflict: "user_id, recipient_phone" }
      )
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in recordConsent:", err);
    return { data: null, error: err.message || "Failed to record consent in database" };
  }
}

export async function getConsentStatus(
  userId: string,
  recipientPhone: string
): Promise<ServiceResult<ConsentRecordRow | null>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("consent_records")
      .select("*")
      .eq("user_id", userId)
      .eq("recipient_phone", recipientPhone)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in getConsentStatus:", err);
    return { data: null, error: err.message || "Failed to query consent record" };
  }
}

// ==============================================================================
// 5. SUPPRESSION LIST SERVICE (Phase 10: Security & Abuse Prevention)
// ==============================================================================

export async function checkIsSuppressed(phone: string): Promise<boolean> {
  const normalized = sanitizePhoneNumber(phone);

  if (!isSupabaseConfigured()) {
    return isLocalSuppressed(normalized);
  }

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("suppression_list")
      .select("id")
      .eq("recipient_phone", normalized)
      .maybeSingle();

    if (data) return true;
    return isLocalSuppressed(normalized);
  } catch {
    return isLocalSuppressed(normalized);
  }
}

export async function addToSuppressionList(
  phone: string,
  reason: SuppressionReasonType = "user_opt_out",
  userId?: string,
  source = "web_portal"
): Promise<ServiceResult<SuppressionRecordRow>> {
  const normalized = sanitizePhoneNumber(phone);
  addLocalSuppression(normalized, reason, source);

  if (!isSupabaseConfigured()) {
    return {
      data: {
        id: `sup_${Date.now()}`,
        recipient_phone: normalized,
        reason,
        source,
        user_id: userId || null,
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("suppression_list")
      .upsert(
        {
          recipient_phone: normalized,
          reason,
          source,
          user_id: userId || null,
          created_at: new Date().toISOString(),
        },
        { onConflict: "recipient_phone" }
      )
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in addToSuppressionList:", err);
    return { data: null, error: err.message || "Failed to add number to suppression list" };
  }
}

export async function removeFromSuppressionList(
  phone: string,
  userId?: string
): Promise<ServiceResult<boolean>> {
  const normalized = sanitizePhoneNumber(phone);
  removeLocalSuppression(normalized);

  if (!isSupabaseConfigured()) {
    return { data: true, error: null };
  }

  try {
    const supabase = createClient();
    let query = supabase.from("suppression_list").delete().eq("recipient_phone", normalized);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { error } = await query;
    if (error) throw error;
    return { data: true, error: null };
  } catch (err: any) {
    console.error("Error in removeFromSuppressionList:", err);
    return { data: false, error: err.message || "Failed to remove from suppression list" };
  }
}

export async function getUserSuppressionList(
  userId?: string
): Promise<ServiceResult<SuppressionRecordRow[]>> {
  if (!isSupabaseConfigured()) {
    return { data: getLocalSuppressionList() as any, error: null };
  }

  try {
    const supabase = createClient();
    let query = supabase
      .from("suppression_list")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err: any) {
    console.error("Error in getUserSuppressionList:", err);
    return { data: getLocalSuppressionList() as any, error: null };
  }
}

// ==============================================================================
// 6. ABUSE REPORTS SERVICE
// ==============================================================================

export async function createAbuseReport(
  report: AbuseReportInsert
): Promise<ServiceResult<AbuseReportRow>> {
  if (!isSupabaseConfigured()) {
    return {
      data: {
        id: `rep_${Date.now()}`,
        reporter_user_id: report.reporter_user_id,
        target_phone: report.target_phone,
        report_type: report.report_type,
        description: report.description,
        evidence_message_id: report.evidence_message_id ?? null,
        status: report.status || "pending",
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("abuse_reports")
      .insert({
        ...report,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in createAbuseReport:", err);
    return { data: null, error: err.message || "Failed to create abuse report" };
  }
}

export async function getUserAbuseReports(
  userId: string
): Promise<ServiceResult<AbuseReportRow[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("abuse_reports")
      .select("*")
      .eq("reporter_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err: any) {
    console.error("Error in getUserAbuseReports:", err);
    return { data: [], error: err.message || "Failed to fetch abuse reports" };
  }
}

// ==============================================================================
// 7. SECURITY AUDIT LOGS SERVICE
// ==============================================================================

export async function getUserAuditLogs(
  userId?: string,
  limit = 50
): Promise<ServiceResult<SecurityAuditLogRow[]>> {
  if (!isSupabaseConfigured()) {
    return { data: getLocalAuditLogs(userId, limit) as any, error: null };
  }

  try {
    const supabase = createClient();
    let query = supabase
      .from("security_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err: any) {
    console.error("Error in getUserAuditLogs:", err);
    return { data: getLocalAuditLogs(userId, limit) as any, error: null };
  }
}

