-- Store each image generation with its prompt so users can search their history.
create table if not exists public.generations (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  mode          text not null,
  prompt        text not null,
  image_url     text not null,
  created_at    timestamptz not null default now()
);

-- Index for fast history lookup and prompt search.
create index if not exists idx_generations_clerk_user_id on public.generations(clerk_user_id);
create index if not exists idx_generations_prompt on public.generations using gin(to_tsvector('french', prompt));

-- Row-level security: service role bypasses automatically; users can only read their own rows.
alter table public.generations enable row level security;

-- Idempotent policy creation: PostgreSQL does not support IF NOT EXISTS on CREATE POLICY.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'generations'
      and policyname = 'generations_select_own'
  ) then
    create policy generations_select_own
      on public.generations
      for select
      using (clerk_user_id = current_setting('request.clerk_user_id', true));
  end if;
end
$$;
