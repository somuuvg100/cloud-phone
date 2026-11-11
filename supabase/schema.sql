-- ==============================================================================
-- ReachOut – Global Messaging Platform
-- Supabase PostgreSQL Schema with RLS, Indexes, Triggers, and Stored Procedures
-- Tables: profiles, messages, messaging_preferences, consent_records
-- ==============================================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  company_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. MESSAGES TABLE
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_phone text not null,
  recipient_country text not null,
  message_body text not null,
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'delivered', 'undelivered', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  delivered_at timestamp with time zone,
  segments integer default 1 check (segments >= 1),
  cost_estimate numeric(10,4) default 0.0079
);

-- 3. MESSAGING_PREFERENCES TABLE
create table if not exists public.messaging_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  daily_limit integer not null default 1000 check (daily_limit >= 0),
  messages_sent_today integer not null default 0 check (messages_sent_today >= 0),
  last_reset_date date not null default current_date,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CONSENT_RECORDS TABLE
create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_phone text not null,
  consent_status text not null default 'opted_in' check (consent_status in ('opted_in', 'opted_out', 'revoked', 'pending')),
  consent_timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  consent_source text default 'web_portal',
  unique (user_id, recipient_phone)
);

-- ==============================================================================
-- INDEXES FOR FAST FILTERING & REPORTING
-- ==============================================================================

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_messages_user_id on public.messages(user_id);
create index if not exists idx_messages_created_at on public.messages(created_at desc);
create index if not exists idx_messages_status on public.messages(status);
create index if not exists idx_messages_provider_id on public.messages(provider_message_id);
create index if not exists idx_messages_recipient_phone on public.messages(recipient_phone);
create index if not exists idx_messaging_preferences_user on public.messaging_preferences(user_id);
create index if not exists idx_consent_user_phone on public.consent_records(user_id, recipient_phone);
create index if not exists idx_consent_status on public.consent_records(consent_status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.messaging_preferences enable row level security;
alter table public.consent_records enable row level security;

-- PROFILES Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- MESSAGES Policies
drop policy if exists "Users can view own messages" on public.messages;
create policy "Users can view own messages"
  on public.messages for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own messages" on public.messages;
create policy "Users can insert own messages"
  on public.messages for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own messages" on public.messages;
create policy "Users can update own messages"
  on public.messages for update using (auth.uid() = user_id);

-- MESSAGING PREFERENCES Policies
drop policy if exists "Users can view own preferences" on public.messaging_preferences;
create policy "Users can view own preferences"
  on public.messaging_preferences for select using (auth.uid() = user_id);

drop policy if exists "Users can update own preferences" on public.messaging_preferences;
create policy "Users can update own preferences"
  on public.messaging_preferences for update using (auth.uid() = user_id);

drop policy if exists "Users can insert own preferences" on public.messaging_preferences;
create policy "Users can insert own preferences"
  on public.messaging_preferences for insert with check (auth.uid() = user_id);

-- CONSENT RECORDS Policies
drop policy if exists "Users can view own consent records" on public.consent_records;
create policy "Users can view own consent records"
  on public.consent_records for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own consent records" on public.consent_records;
create policy "Users can insert own consent records"
  on public.consent_records for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own consent records" on public.consent_records;
create policy "Users can update own consent records"
  on public.consent_records for update using (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC TRIGGERS
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.messaging_preferences (user_id, daily_limit, messages_sent_today, last_reset_date)
  values (new.id, 1000, 0, current_date)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_preferences_updated on public.messaging_preferences;
create trigger on_preferences_updated
  before update on public.messaging_preferences
  for each row execute procedure public.handle_updated_at();

-- Safe allowance increment stored procedure
create or replace function public.increment_message_count(p_user_id uuid, p_count integer default 1)
returns table(remaining integer, sent_today integer, daily_limit integer) as $$
declare
  v_prefs record;
begin
  select * into v_prefs
  from public.messaging_preferences
  where user_id = p_user_id
  for update;

  if not found then
    insert into public.messaging_preferences (user_id, daily_limit, messages_sent_today, last_reset_date)
    values (p_user_id, 1000, p_count, current_date)
    returning * into v_prefs;
  else
    if v_prefs.last_reset_date < current_date then
      update public.messaging_preferences
      set messages_sent_today = p_count,
          last_reset_date = current_date,
          updated_at = timezone('utc'::text, now())
      where user_id = p_user_id
      returning * into v_prefs;
    else
      update public.messaging_preferences
      set messages_sent_today = messages_sent_today + p_count,
          updated_at = timezone('utc'::text, now())
      where user_id = p_user_id
      returning * into v_prefs;
    end if;
  end if;

  return query select
    greatest(0, v_prefs.daily_limit - v_prefs.messages_sent_today) as remaining,
    v_prefs.messages_sent_today as sent_today,
    v_prefs.daily_limit as daily_limit;
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- 5. SUPPRESSION LIST TABLE (Phase 10: Security & Abuse Prevention)
-- ==============================================================================
create table if not exists public.suppression_list (
  id uuid primary key default gen_random_uuid(),
  recipient_phone text not null unique,
  reason text not null check (reason in ('stop_keyword', 'user_opt_out', 'spam_complaint', 'admin_block', 'carrier_block')),
  source text default 'inbound_sms',
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 6. ABUSE REPORTS TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 7. SECURITY AUDIT LOGS TABLE
-- ==============================================================================
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

-- Security Indexes
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

-- Security RLS
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

-- Check if Phone is Suppressed Function
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

-- ==============================================================================
-- 8. BLACKTEL.IO VIRTUAL TELECOM SUITE
-- Tables: virtual_numbers, wallet_credits, wallet_transactions, inbox_messages, call_logs
-- ==============================================================================

create table if not exists public.virtual_numbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  phone_number text not null unique,
  country_code text not null,
  country_name text not null,
  type text not null default 'mobile' check (type in ('mobile', 'local', 'toll_free', 'whatsapp_sim', 'trash_sim')),
  capabilities text[] not null default array['sms', 'voice'],
  status text not null default 'active' check (status in ('active', 'expired', 'renewing', 'suspended')),
  monthly_price_credits integer not null default 15,
  auto_renew boolean default true,
  forward_to_phone text,
  forward_to_email text,
  auto_reply_text text,
  expires_at timestamp with time zone not null default (now() + interval '30 days'),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.wallet_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  balance_credits integer not null default 120 check (balance_credits >= 0),
  currency text default 'USD',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_credits integer not null,
  type text not null check (type in ('credit_topup', 'number_rental', 'sms_outbound', 'call_outbound', 'sms_inbound', 'refund')),
  description text not null,
  reference_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  virtual_number_id uuid references public.virtual_numbers(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender_phone text not null,
  recipient_phone text not null,
  body text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  virtual_number_id uuid references public.virtual_numbers(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  from_number text not null,
  to_number text not null,
  duration_seconds integer default 0 check (duration_seconds >= 0),
  status text not null default 'completed' check (status in ('completed', 'busy', 'no_answer', 'failed', 'canceled')),
  recording_url text,
  cost_credits integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Blacktel Indexes
create index if not exists idx_vnumbers_user on public.virtual_numbers(user_id);
create index if not exists idx_vnumbers_phone on public.virtual_numbers(phone_number);
create index if not exists idx_vnumbers_status on public.virtual_numbers(status);

create index if not exists idx_wallet_user on public.wallet_credits(user_id);
create index if not exists idx_wtransactions_user on public.wallet_transactions(user_id, created_at desc);

create index if not exists idx_inbox_user on public.inbox_messages(user_id, created_at desc);
create index if not exists idx_inbox_vnumber on public.inbox_messages(virtual_number_id);
create index if not exists idx_inbox_sender on public.inbox_messages(sender_phone);

create index if not exists idx_call_logs_user on public.call_logs(user_id, created_at desc);
create index if not exists idx_call_logs_vnumber on public.call_logs(virtual_number_id);

-- Blacktel RLS
alter table public.virtual_numbers enable row level security;
alter table public.wallet_credits enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.inbox_messages enable row level security;
alter table public.call_logs enable row level security;

drop policy if exists "Users manage own virtual numbers" on public.virtual_numbers;
create policy "Users manage own virtual numbers"
  on public.virtual_numbers for all using (auth.uid() = user_id);

drop policy if exists "Users view own wallet credits" on public.wallet_credits;
create policy "Users view own wallet credits"
  on public.wallet_credits for select using (auth.uid() = user_id);

drop policy if exists "Users modify own wallet credits" on public.wallet_credits;
create policy "Users modify own wallet credits"
  on public.wallet_credits for all using (auth.uid() = user_id);

drop policy if exists "Users view own wallet transactions" on public.wallet_transactions;
create policy "Users view own wallet transactions"
  on public.wallet_transactions for select using (auth.uid() = user_id);

drop policy if exists "Users insert own wallet transactions" on public.wallet_transactions;
create policy "Users insert own wallet transactions"
  on public.wallet_transactions for insert with check (auth.uid() = user_id);

drop policy if exists "Users manage own inbox messages" on public.inbox_messages;
create policy "Users manage own inbox messages"
  on public.inbox_messages for all using (auth.uid() = user_id);

drop policy if exists "Users manage own call logs" on public.call_logs;
create policy "Users manage own call logs"
  on public.call_logs for all using (auth.uid() = user_id);
