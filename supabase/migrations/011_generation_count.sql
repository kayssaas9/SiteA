-- Track the number of successfully finalized generations per user.
-- Run this migration in the Supabase SQL Editor.

alter table public.users
  add column if not exists generation_count integer not null default 0;

-- Initialize existing users from the generations already stored.
-- Completed teaser generations are included; failed and unfinished jobs are not.
update public.users as u
set generation_count = counts.total
from (
  select
    clerk_user_id,
    count(*)::integer as total
  from public.generations
  where status = 'completed'
  group by clerk_user_id
) as counts
where u.clerk_user_id = counts.clerk_user_id;

-- Users without a completed generation keep the default value of zero.
update public.users
set generation_count = 0
where generation_count is null;

create or replace function public.increment_generation_count_on_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Count only the first transition to completed. This prevents duplicate
  -- increments if a persisted job is resumed or finalized more than once.
  if old.status is distinct from 'completed' and new.status = 'completed' then
    update public.users
    set generation_count = coalesce(generation_count, 0) + 1
    where clerk_user_id = new.clerk_user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_generations_increment_count on public.generations;

create trigger trg_generations_increment_count
after update of status on public.generations
for each row
when (old.status is distinct from 'completed' and new.status = 'completed')
execute function public.increment_generation_count_on_completion();