-- Track whether a user has already completed the survey.
alter table public.users
  add column if not exists survey_completed boolean not null default false;

-- Store survey responses.
create table if not exists public.survey_responses (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references public.users(clerk_user_id),
  answers       jsonb not null default '{}',
  completed_at  timestamptz not null default now(),
  unique (user_id)
);

-- Index for quick lookup by user.
create index if not exists idx_survey_responses_user_id on public.survey_responses(user_id);

-- Row-level security: users can only read their own responses.
alter table public.survey_responses enable row level security;

create policy if not exists survey_responses_select_own
  on public.survey_responses
  for select
  using (user_id = current_setting('request.clerk_user_id', true));
