-- ==============================================================================
-- ReachOut – Phase 10: Security & Abuse Prevention Migration
-- Adds suppression_list, abuse_reports, and security_audit_logs tables
-- Configures RLS, audit indexes, and suppression check functions
-- ==============================================================================

-- 1. SUPPRESSION LIST TABLE
-- Stores recipients who have opted out, submitted spam complaints, or been suppressed
create table if not exists public.suppression_list (
  id uuid primary key default gen_random_uuid(),
  recipient_phone text not null unique,
  reason text not null check (reason in ('stop_keyword', 'user_opt_out', 'spam_complaint', 'admin_block', 'carrier_block')),
  source text default 'inbound_sms',
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ABUSE REPORTS TABLE
-- Allows reporting unwanted, unsolicited, phishing, or harassment messages
create table if not exists public.abuse_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.profiles(id) on delete cascade,
  target_phone text not null,
  report_type text not null check (report_type in ('unsolicited_spam', 'harassment', 'phishing', 'spoofing', 'other')),
  description text not null,
  evidence_message_id uuid references public.messages(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'investigating', 'action_taken', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. SECURITY AUDIT LOGS TABLE
-- Immutable security event stream for abuse monitoring, rate limiting, and forensics
create table if not exists public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  severity text not null check (severity in ('info', 'warn', 'error', 'critical')),
  ip_address text,
  user_agent text,
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

create index if not exists idx_suppression_phone on public.suppression_list(recipient_phone);
create index if not exists idx_suppression_reason on public.suppression_list(reason);
create index if not exists idx_suppression_user on public.suppression_list(user_id);

create index if not exists idx_abuse_reporter on public.abuse_reports(reporter_user_id);
create index if not exists idx_abuse_target_phone on public.abuse_reports(target_phone);
create index if not exists idx_abuse_status on public.abuse_reports(status);
create index if not exists idx_abuse_created_at on public.abuse_reports(created_at desc);

create index if not exists idx_audit_user_id on public.security_audit_logs(user_id);
create index if not exists idx_audit_event_type on public.security_audit_logs(event_type);
create index if not exists idx_audit_severity on public.security_audit_logs(severity);
create index if not exists idx_audit_created_at on public.security_audit_logs(created_at desc);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

alter table public.suppression_list enable row level security;
alter table public.abuse_reports enable row level security;
alter table public.security_audit_logs enable row level security;

-- Suppression List Policies
drop policy if exists "Authenticated users can read suppression list" on public.suppression_list;
create policy "Authenticated users can read suppression list"
  on public.suppression_list for select using (auth.role() = 'authenticated');

drop policy if exists "Users can add to suppression list" on public.suppression_list;
create policy "Users can add to suppression list"
  on public.suppression_list for insert with check (
    auth.role() = 'authenticated' and (user_id is null or user_id = auth.uid())
  );

drop policy if exists "Users can delete own suppression items" on public.suppression_list;
create policy "Users can delete own suppression items"
  on public.suppression_list for delete using (
    user_id = auth.uid()
  );

-- Abuse Reports Policies
drop policy if exists "Users can view their own abuse reports" on public.abuse_reports;
create policy "Users can view their own abuse reports"
  on public.abuse_reports for select using (reporter_user_id = auth.uid());

drop policy if exists "Users can submit abuse reports" on public.abuse_reports;
create policy "Users can submit abuse reports"
  on public.abuse_reports for insert with check (reporter_user_id = auth.uid());

-- Security Audit Logs Policies
drop policy if exists "Users can view their own security audit logs" on public.security_audit_logs;
create policy "Users can view their own security audit logs"
  on public.security_audit_logs for select using (user_id = auth.uid());

drop policy if exists "Authenticated users can insert audit logs" on public.security_audit_logs;
create policy "Authenticated users can insert audit logs"
  on public.security_audit_logs for insert with check (
    auth.role() = 'authenticated' and (user_id is null or user_id = auth.uid())
  );

-- ==============================================================================
-- HELPER STORED PROCEDURE: Check if Phone is Suppressed
-- ==============================================================================
create or replace function public.is_phone_suppressed(p_phone text)
returns boolean as $$
declare
  v_exists boolean;
begin
  select exists(
    select 1 from public.suppression_list
    where recipient_phone = p_phone
  ) into v_exists;
  return v_exists;
end;
$$ language plpgsql security definer;

