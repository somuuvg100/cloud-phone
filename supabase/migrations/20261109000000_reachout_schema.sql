-- ==============================================================================
-- ReachOut – Global Messaging Platform
-- Migration: Complete Supabase PostgreSQL Schema with RLS and Indexes
-- ==============================================================================

-- 1. Create PROFILES Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  company_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create MESSAGES Table
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

-- 3. Create MESSAGING_PREFERENCES Table
create table if not exists public.messaging_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  daily_limit integer not null default 1000 check (daily_limit >= 0),
  messages_sent_today integer not null default 0 check (messages_sent_today >= 0),
  last_reset_date date not null default current_date,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create CONSENT_RECORDS Table
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
-- INDEXES FOR OPTIMIZED TELEMETRY & QUERY PERFORMANCE
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
-- Strict Isolation: Users can access ONLY their own records
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.messaging_preferences enable row level security;
alter table public.consent_records enable row level security;

-- PROFILES Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- MESSAGES Policies
drop policy if exists "Users can view own messages" on public.messages;
create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own messages" on public.messages;
create policy "Users can insert own messages"
  on public.messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own messages" on public.messages;
create policy "Users can update own messages"
  on public.messages for update
  using (auth.uid() = user_id);

-- MESSAGING PREFERENCES Policies
drop policy if exists "Users can view own preferences" on public.messaging_preferences;
create policy "Users can view own preferences"
  on public.messaging_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own preferences" on public.messaging_preferences;
create policy "Users can update own preferences"
  on public.messaging_preferences for update
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own preferences" on public.messaging_preferences;
create policy "Users can insert own preferences"
  on public.messaging_preferences for insert
  with check (auth.uid() = user_id);

-- CONSENT RECORDS Policies
drop policy if exists "Users can view own consent records" on public.consent_records;
create policy "Users can view own consent records"
  on public.consent_records for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own consent records" on public.consent_records;
create policy "Users can insert own consent records"
  on public.consent_records for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own consent records" on public.consent_records;
create policy "Users can update own consent records"
  on public.consent_records for update
  using (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC TRIGGERS & STORED PROCEDURES
-- ==============================================================================

-- 1. Trigger to auto-create Profile and Messaging Preferences when new user registers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Insert into public.profiles
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Insert default messaging preferences (1,000 daily limit)
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

-- 2. Trigger for updated_at timestamps
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

-- 3. Stored Procedure to safely increment sent count with daily auto-reset
create or replace function public.increment_message_count(p_user_id uuid, p_count integer default 1)
returns table(remaining integer, sent_today integer, daily_limit integer) as $$
declare
  v_prefs record;
begin
  -- Fetch current preferences with lock
  select * into v_prefs
  from public.messaging_preferences
  where user_id = p_user_id
  for update;

  if not found then
    -- Create default if not exists
    insert into public.messaging_preferences (user_id, daily_limit, messages_sent_today, last_reset_date)
    values (p_user_id, 1000, p_count, current_date)
    returning * into v_prefs;
  else
    -- If new day, reset counter to 0 before incrementing
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

