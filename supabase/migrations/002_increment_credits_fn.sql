-- Atomic credit increment — call via supabase.rpc("increment_credits", {...})
-- Run in Supabase SQL editor after 001_users.sql
create or replace function public.increment_credits(
  p_clerk_user_id text,
  p_amount        integer
)
returns void language plpgsql security definer as $$
begin
  update public.users
  set credits = credits + p_amount
  where clerk_user_id = p_clerk_user_id;
end;
$$;
