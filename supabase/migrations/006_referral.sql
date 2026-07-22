-- Referral system: personal code, who referred the user, and referral ledger.
alter table public.users
  add column if not exists referral_code text unique;

alter table public.users
  add column if not exists referred_by text;

create table if not exists public.referrals (
  id             uuid primary key default gen_random_uuid(),
  referrer_id    text not null references public.users(clerk_user_id),
  referred_id    text not null references public.users(clerk_user_id) unique,
  reward_granted boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists idx_referrals_referrer_id on public.referrals(referrer_id);
create index if not exists idx_referrals_referred_id on public.referrals(referred_id);

-- Helper to generate random 7-char alphanumeric referral codes.
create or replace function generate_referral_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i int;
begin
  for i in 1..7 loop
    result := result || substr(chars, floor(random() * 62 + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- Backfill existing users that don't have a referral code yet.
-- Keep retrying if a generated code collides (unlikely with 62^7 combinations).
do $$
declare
  rec record;
  new_code text;
  attempts int;
begin
  for rec in select clerk_user_id from public.users where referral_code is null loop
    attempts := 0;
    loop
      new_code := generate_referral_code();
      attempts := attempts + 1;
      begin
        update public.users
        set referral_code = new_code
        where clerk_user_id = rec.clerk_user_id;
        exit;
      exception when unique_violation then
        if attempts > 10 then
          raise exception 'Could not generate unique referral code for %', rec.clerk_user_id;
        end if;
      end;
    end loop;
  end loop;
end;
$$;
