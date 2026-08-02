-- Teaser generations keep the original URL server-side and expose only a
-- server-generated blurred preview until the user unlocks the generation.
alter table public.generations
  add column if not exists preview_url text,
  add column if not exists unlocked boolean not null default true;

-- Public is safe here because preview_url contains only the blurred derivative.
-- The original image_url remains protected by the API response rules.
insert into storage.buckets (id, name, public)
values ('generation-previews', 'generation-previews', true)
on conflict (id) do update set public = true;

-- Consume all remaining credits for a teaser when fewer than one generation
-- remains, or the full generation cost otherwise. The row lock prevents two
-- concurrent generations from spending the same credits.
create or replace function public.consume_generation_credits(
  p_clerk_user_id text,
  p_maximum integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_credits integer;
  consumed integer;
begin
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

  return consumed;
end;
$$;