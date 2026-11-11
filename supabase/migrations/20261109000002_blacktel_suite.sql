-- ==============================================================================
-- ReachOut – Blacktel.io Virtual Telecommunications Suite Migration
-- Tables: virtual_numbers, wallet_credits, wallet_transactions, inbox_messages, call_logs
-- ==============================================================================

-- 1. VIRTUAL NUMBERS TABLE
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

-- 2. WALLET CREDITS TABLE
create table if not exists public.wallet_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  balance_credits integer not null default 120 check (balance_credits >= 0),
  currency text default 'USD',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. WALLET TRANSACTIONS TABLE
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_credits integer not null,
  type text not null check (type in ('credit_topup', 'number_rental', 'sms_outbound', 'call_outbound', 'sms_inbound', 'refund')),
  description text not null,
  reference_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. INBOX MESSAGES (2-Way Chat Threads)
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

-- 5. CALL LOGS (Browser Webphone & Inbound)
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

-- ==============================================================================
-- INDEXES
-- ==============================================================================

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

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

alter table public.virtual_numbers enable row level security;
alter table public.wallet_credits enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.inbox_messages enable row level security;
alter table public.call_logs enable row level security;

-- Virtual Numbers RLS
drop policy if exists "Users manage own virtual numbers" on public.virtual_numbers;
create policy "Users manage own virtual numbers"
  on public.virtual_numbers for all using (auth.uid() = user_id);

-- Wallet Credits RLS
drop policy if exists "Users view own wallet credits" on public.wallet_credits;
create policy "Users view own wallet credits"
  on public.wallet_credits for select using (auth.uid() = user_id);

drop policy if exists "Users modify own wallet credits" on public.wallet_credits;
create policy "Users modify own wallet credits"
  on public.wallet_credits for all using (auth.uid() = user_id);

-- Wallet Transactions RLS
drop policy if exists "Users view own wallet transactions" on public.wallet_transactions;
create policy "Users view own wallet transactions"
  on public.wallet_transactions for select using (auth.uid() = user_id);

drop policy if exists "Users insert own wallet transactions" on public.wallet_transactions;
create policy "Users insert own wallet transactions"
  on public.wallet_transactions for insert with check (auth.uid() = user_id);

-- Inbox Messages RLS
drop policy if exists "Users manage own inbox messages" on public.inbox_messages;
create policy "Users manage own inbox messages"
  on public.inbox_messages for all using (auth.uid() = user_id);

-- Call Logs RLS
drop policy if exists "Users manage own call logs" on public.call_logs;
create policy "Users manage own call logs"
  on public.call_logs for all using (auth.uid() = user_id);

-- ==============================================================================
-- STORED PROCEDURE: Safe Credit Deduction & Topup
-- ==============================================================================

create or replace function public.deduct_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text,
  p_reference_id text default null
)
returns table(new_balance integer, success boolean, message text) as $$
declare
  v_current_balance integer;
begin
  select balance_credits into v_current_balance
  from public.wallet_credits
  where user_id = p_user_id
  for update;

  if not found then
    -- Initialize default wallet
    insert into public.wallet_credits (user_id, balance_credits)
    values (p_user_id, 120)
    returning balance_credits into v_current_balance;
  end if;

  if v_current_balance < p_amount then
    return query select v_current_balance, false, 'Insufficient credit balance'::text;
    return;
  end if;

  update public.wallet_credits
  set balance_credits = balance_credits - p_amount,
      updated_at = timezone('utc'::text, now())
  where user_id = p_user_id
  returning balance_credits into v_current_balance;

  insert into public.wallet_transactions (user_id, amount_credits, type, description, reference_id)
  values (p_user_id, -p_amount, p_type, p_description, p_reference_id);

  return query select v_current_balance, true, 'Credits deducted successfully'::text;
end;
$$ language plpgsql security definer;

create or replace function public.add_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text,
  p_reference_id text default null
)
returns table(new_balance integer) as $$
declare
  v_new_balance integer;
begin
  insert into public.wallet_credits (user_id, balance_credits)
  values (p_user_id, p_amount + 120)
  on conflict (user_id) do update
  set balance_credits = public.wallet_credits.balance_credits + p_amount,
      updated_at = timezone('utc'::text, now())
  returning balance_credits into v_new_balance;

  insert into public.wallet_transactions (user_id, amount_credits, type, description, reference_id)
  values (p_user_id, p_amount, p_type, p_description, p_reference_id);

  return query select v_new_balance;
end;
$$ language plpgsql security definer;

