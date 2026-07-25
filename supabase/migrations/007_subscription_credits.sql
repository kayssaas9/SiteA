-- Run this in Supabase SQL Editor (or via CLI: supabase db push)
-- Tracks which Stripe subscriptions have already been credited to prevent duplicates
-- when both checkout.session.completed and customer.subscription.updated fire.
create table if not exists public.subscription_credits (
  subscription_id   text primary key,
  clerk_user_id     text not null references public.users(clerk_user_id) on delete cascade,
  plan              text not null,
  credits_added     integer not null default 0,
  created_at        timestamptz not null default now()
);

comment on table public.subscription_credits is 'Idempotency log for subscription credit grants.';

-- Index for quick look-ups by user if needed for debugging.
create index if not exists idx_subscription_credits_clerk_user_id
  on public.subscription_credits(clerk_user_id);

-- Service role bypasses RLS automatically; lock the table down for safety.
alter table public.subscription_credits enable row level security;
