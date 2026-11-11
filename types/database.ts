export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MessageStatusType =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "undelivered"
  | "failed";

export type ConsentStatusType = "opted_in" | "opted_out" | "revoked" | "pending";

export type SuppressionReasonType =
  | "stop_keyword"
  | "user_opt_out"
  | "spam_complaint"
  | "admin_block"
  | "carrier_block";

export type AbuseReportType =
  | "unsolicited_spam"
  | "harassment"
  | "phishing"
  | "spoofing"
  | "other";

export type AbuseReportStatus =
  | "pending"
  | "investigating"
  | "action_taken"
  | "dismissed";

export type AuditSeverity = "info" | "warn" | "error" | "critical";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          company_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          company_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          company_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          user_id: string;
          recipient_phone: string;
          recipient_country: string;
          message_body: string;
          provider_message_id: string | null;
          status: MessageStatusType;
          created_at: string;
          delivered_at: string | null;
          segments: number;
          cost_estimate: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipient_phone: string;
          recipient_country: string;
          message_body: string;
          provider_message_id?: string | null;
          status?: MessageStatusType;
          created_at?: string;
          delivered_at?: string | null;
          segments?: number;
          cost_estimate?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipient_phone?: string;
          recipient_country?: string;
          message_body?: string;
          provider_message_id?: string | null;
          status?: MessageStatusType;
          created_at?: string;
          delivered_at?: string | null;
          segments?: number;
          cost_estimate?: number | null;
        };
      };
      messaging_preferences: {
        Row: {
          id: string;
          user_id: string;
          daily_limit: number;
          messages_sent_today: number;
          last_reset_date: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_limit?: number;
          messages_sent_today?: number;
          last_reset_date?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          daily_limit?: number;
          messages_sent_today?: number;
          last_reset_date?: string;
          updated_at?: string;
        };
      };
      consent_records: {
        Row: {
          id: string;
          user_id: string;
          recipient_phone: string;
          consent_status: ConsentStatusType;
          consent_timestamp: string;
          created_at: string;
          consent_source: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipient_phone: string;
          consent_status?: ConsentStatusType;
          consent_timestamp?: string;
          created_at?: string;
          consent_source?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipient_phone?: string;
          consent_status?: ConsentStatusType;
          consent_timestamp?: string;
          created_at?: string;
          consent_source?: string | null;
        };
      };
      suppression_list: {
        Row: {
          id: string;
          recipient_phone: string;
          reason: SuppressionReasonType;
          source: string | null;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_phone: string;
          reason: SuppressionReasonType;
          source?: string | null;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_phone?: string;
          reason?: SuppressionReasonType;
          source?: string | null;
          user_id?: string | null;
          created_at?: string;
        };
      };
      abuse_reports: {
        Row: {
          id: string;
          reporter_user_id: string;
          target_phone: string;
          report_type: AbuseReportType;
          description: string;
          evidence_message_id: string | null;
          status: AbuseReportStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_user_id: string;
          target_phone: string;
          report_type: AbuseReportType;
          description: string;
          evidence_message_id?: string | null;
          status?: AbuseReportStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_user_id?: string;
          target_phone?: string;
          report_type?: AbuseReportType;
          description?: string;
          evidence_message_id?: string | null;
          status?: AbuseReportStatus;
          created_at?: string;
        };
      };
      security_audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          severity: AuditSeverity;
          ip_address: string | null;
          user_agent: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          severity: AuditSeverity;
          ip_address?: string | null;
          user_agent?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_type?: string;
          severity?: AuditSeverity;
          ip_address?: string | null;
          user_agent?: string | null;
          details?: Json;
          created_at?: string;
        };
      };
    };
  };
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type MessageUpdate = Database["public"]["Tables"]["messages"]["Update"];

export type MessagingPreferencesRow = Database["public"]["Tables"]["messaging_preferences"]["Row"];
export type MessagingPreferencesInsert = Database["public"]["Tables"]["messaging_preferences"]["Insert"];
export type MessagingPreferencesUpdate = Database["public"]["Tables"]["messaging_preferences"]["Update"];

export type ConsentRecordRow = Database["public"]["Tables"]["consent_records"]["Row"];
export type ConsentRecordInsert = Database["public"]["Tables"]["consent_records"]["Insert"];
export type ConsentRecordUpdate = Database["public"]["Tables"]["consent_records"]["Update"];

export type SuppressionRecordRow = Database["public"]["Tables"]["suppression_list"]["Row"];
export type SuppressionRecordInsert = Database["public"]["Tables"]["suppression_list"]["Insert"];
export type SuppressionRecordUpdate = Database["public"]["Tables"]["suppression_list"]["Update"];

export type AbuseReportRow = Database["public"]["Tables"]["abuse_reports"]["Row"];
export type AbuseReportInsert = Database["public"]["Tables"]["abuse_reports"]["Insert"];
export type AbuseReportUpdate = Database["public"]["Tables"]["abuse_reports"]["Update"];

export type SecurityAuditLogRow = Database["public"]["Tables"]["security_audit_logs"]["Row"];
export type SecurityAuditLogInsert = Database["public"]["Tables"]["security_audit_logs"]["Insert"];
export type SecurityAuditLogUpdate = Database["public"]["Tables"]["security_audit_logs"]["Update"];

