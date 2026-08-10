create extension if not exists pgcrypto;

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  survey_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_responses (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  response_json jsonb not null,
  submitted_at timestamptz not null default now()
);

create index if not exists forms_status_idx on public.forms(status);
create index if not exists forms_slug_idx on public.forms(slug);
create index if not exists form_responses_form_id_idx on public.form_responses(form_id);
create index if not exists form_responses_submitted_at_idx on public.form_responses(submitted_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists forms_set_updated_at on public.forms;
create trigger forms_set_updated_at
before update on public.forms
for each row execute function public.set_updated_at();
