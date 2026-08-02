-- Persist the OneShot job separately from the browser request so a generation
-- can be resumed after a refresh or when the page is closed.
alter table public.generations
  alter column image_url drop not null,
  add column if not exists oneshot_job_id text,
  add column if not exists status text not null default 'completed',
  add column if not exists teaser boolean not null default false,
  add column if not exists free_teaser_claimed boolean not null default false,
  add column if not exists consumed_credits integer not null default 0,
  add column if not exists error_message text,
  add column if not exists updated_at timestamptz not null default now();

update public.generations
   set updated_at = created_at
 where updated_at is null;

create index if not exists idx_generations_processing
  on public.generations(clerk_user_id, status, created_at desc);

-- Consume paid-generation credits exactly once, even if finalization is
-- retried after a server restart. Both rows are locked in one transaction.
create or replace function public.consume_generation_credits_for_generation(
  p_generation_id uuid,
  p_clerk_user_id text,
  p_maximum integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  already_consumed integer;
  current_credits integer;
  consumed integer;
begin
  select consumed_credits
    into already_consumed
    from public.generations
   where id = p_generation_id
     and clerk_user_id = p_clerk_user_id
   for update;

  if already_consumed is null then
    raise exception 'Generation not found';
  end if;

  if already_consumed > 0 then
    return already_consumed;
  end if;

  select credits
    into current_credits
    from public.users
   where clerk_user_id = p_clerk_user_id
   for update;

  if current_credits is null or current_credits <= 0 then
    return 0;
  end if;

  consumed := least(current_credits, p_maximum);

  update public.users
     set credits = current_credits - consumed
   where clerk_user_id = p_clerk_user_id;

  update public.generations
     set consumed_credits = consumed,
         updated_at = now()
   where id = p_generation_id
     and clerk_user_id = p_clerk_user_id;

  return consumed;
end;
$$;