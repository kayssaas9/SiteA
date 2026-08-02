-- Expert's subscription grants 20,000 credits.
-- Purchased credit packs remain additive and are never capped by this function.
-- Run this migration in the Supabase SQL Editor.
create or replace function public.increment_credits(
  p_clerk_user_id text,
  p_amount        integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
     set credits = credits + greatest(0, p_amount)
   where clerk_user_id = p_clerk_user_id;
end;
$$;