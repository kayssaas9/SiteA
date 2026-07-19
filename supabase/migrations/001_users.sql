-- Run this once in your Supabase SQL editor (or via CLI: supabase db push)
create table if not exists public.users (
  id                  uuid primary key default gen_random_uuid(),
  clerk_user_id       text unique not null,
  email               text not null,
  plan                text not null default 'free',
  credits             integer not null default 0,
  stripe_customer_id  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Auto-update updated_at on every write
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- Row-level security: service role bypasses automatically
alter table public.users enable row level security;
