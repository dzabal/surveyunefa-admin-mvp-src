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
  respondent_id text,
  submitted_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text default '',
  role text not null check (role in ('global_admin', 'form_admin', 'form_editor', 'viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists forms_status_idx on public.forms(status);
create index if not exists forms_slug_idx on public.forms(slug);
create index if not exists form_responses_form_id_idx on public.form_responses(form_id);
create index if not exists form_responses_submitted_at_idx on public.form_responses(submitted_at desc);
create index if not exists admin_profiles_role_idx on public.admin_profiles(role);
create index if not exists admin_profiles_active_idx on public.admin_profiles(active);

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

drop trigger if exists admin_profiles_set_updated_at on public.admin_profiles;
create trigger admin_profiles_set_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

create or replace function public.current_admin_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.admin_profiles
  where id = auth.uid()
    and active = true
  limit 1
$$;

create or replace function public.current_admin_has_role(allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_admin_role() = any(allowed_roles), false)
$$;

create or replace function public.prevent_last_global_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_global_admins integer;
begin
  if old.role = 'global_admin' and (new.role <> 'global_admin' or new.active = false) then
    select count(*)
    into remaining_global_admins
    from public.admin_profiles
    where role = 'global_admin'
      and active = true
      and id <> old.id;

    if remaining_global_admins = 0 then
      raise exception 'No se puede desactivar o degradar el ultimo admin global.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists admin_profiles_keep_global_admin on public.admin_profiles;
create trigger admin_profiles_keep_global_admin
before update on public.admin_profiles
for each row execute function public.prevent_last_global_admin_removal();

alter table public.forms enable row level security;
alter table public.form_responses enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "Public can read published forms" on public.forms;
create policy "Public can read published forms"
on public.forms
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Admins can read forms" on public.forms;
create policy "Admins can read forms"
on public.forms
for select
to authenticated
using (public.current_admin_has_role(array['global_admin','form_admin','form_editor','viewer']));

drop policy if exists "Admins can create forms" on public.forms;
create policy "Admins can create forms"
on public.forms
for insert
to authenticated
with check (
  public.current_admin_has_role(array['global_admin','form_admin'])
  or (public.current_admin_has_role(array['form_editor']) and status = 'draft')
);

drop policy if exists "Form admins can update forms" on public.forms;
create policy "Form admins can update forms"
on public.forms
for update
to authenticated
using (public.current_admin_has_role(array['global_admin','form_admin']))
with check (public.current_admin_has_role(array['global_admin','form_admin']));

drop policy if exists "Editors can update draft forms" on public.forms;
create policy "Editors can update draft forms"
on public.forms
for update
to authenticated
using (public.current_admin_has_role(array['form_editor']) and status = 'draft')
with check (public.current_admin_has_role(array['form_editor']) and status = 'draft');

drop policy if exists "Form admins can delete forms" on public.forms;
create policy "Form admins can delete forms"
on public.forms
for delete
to authenticated
using (public.current_admin_has_role(array['global_admin','form_admin']));

drop policy if exists "Public can submit published form responses" on public.form_responses;
create policy "Public can submit published form responses"
on public.form_responses
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.forms
    where forms.id = form_responses.form_id
      and forms.status = 'published'
  )
);

drop policy if exists "Admins can read responses" on public.form_responses;
create policy "Admins can read responses"
on public.form_responses
for select
to authenticated
using (public.current_admin_has_role(array['global_admin','form_admin','viewer']));

drop policy if exists "Form admins can delete responses" on public.form_responses;
create policy "Form admins can delete responses"
on public.form_responses
for delete
to authenticated
using (public.current_admin_has_role(array['global_admin','form_admin']));

drop policy if exists "Users can read own profile" on public.admin_profiles;
create policy "Users can read own profile"
on public.admin_profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Global admins can read profiles" on public.admin_profiles;
create policy "Global admins can read profiles"
on public.admin_profiles
for select
to authenticated
using (public.current_admin_has_role(array['global_admin']));

drop policy if exists "Global admins can manage profiles" on public.admin_profiles;
create policy "Global admins can manage profiles"
on public.admin_profiles
for all
to authenticated
using (public.current_admin_has_role(array['global_admin']))
with check (public.current_admin_has_role(array['global_admin']));

drop policy if exists "Global admins can read audit log" on public.admin_audit_log;
create policy "Global admins can read audit log"
on public.admin_audit_log
for select
to authenticated
using (public.current_admin_has_role(array['global_admin']));

-- Bootstrap manual:
-- 1. Crea tu usuario inicial en Supabase Auth.
-- 2. Copia su auth.users.id.
-- 3. Ejecuta esto cambiando los valores:
--
-- insert into public.admin_profiles (id, email, full_name, role, active)
-- values ('AUTH_USER_ID_AQUI', 'tu-correo@dominio.com', 'Admin principal', 'global_admin', true)
-- on conflict (id) do update set role = 'global_admin', active = true, updated_at = now();
