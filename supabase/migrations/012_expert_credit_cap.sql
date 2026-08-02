-- Expert is marketed as unlimited, but its server-side credit wallet is capped
-- at 20,000 credits. Run this migration in the Supabase SQL Editor.

update public.users
   set credits = 20000
 where plan = 'expert'
   and credits > 20000;

create or replace function public.increment_credits(
  p_clerk_user_id text,
  p_amount        integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_plan text;
begin
  select plan
    into current_plan
    from public.users
   where clerk_user_id = p_clerk_user_id
   for update;

  update public.users
     set credits = case
       when current_plan = 'expert'
         then least(20000, credits + greatest(0, p_amount))
       else credits + greatest(0, p_amount)
     end
   where clerk_user_id = p_clerk_user_id;
end;
$$;