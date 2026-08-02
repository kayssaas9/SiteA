-- Allow one real, blurred teaser generation when a Clerk account has no
-- credits. The quota is per account, not per IP address.
alter table public.users
  add column if not exists free_teaser_used boolean not null default false;

-- Atomically reserve the free teaser. The row lock is provided by the UPDATE,
-- so concurrent requests for the same Clerk account cannot both claim it.
create or replace function public.claim_free_teaser(
  p_clerk_user_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
     set free_teaser_used = true
   where clerk_user_id = p_clerk_user_id
     and coalesce(credits, 0) <= 0
     and free_teaser_used = false;

  return found;
end;
$$;

-- If OneShot or preview preparation fails before a generation is saved, make
-- the one-time teaser available again. Never release it after credits arrived.
create or replace function public.release_free_teaser(
  p_clerk_user_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
     set free_teaser_used = false
   where clerk_user_id = p_clerk_user_id
     and coalesce(credits, 0) <= 0
     and free_teaser_used = true;
end;
$$;