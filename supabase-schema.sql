-- Cloud Director Cockpit v2 · SQL para ejecutar una vez en Supabase SQL Editor.
-- Cada persona autenticada solo puede consultar y editar sus propios registros.
-- No usar service_role en el frontend.

create extension if not exists pgcrypto;

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 160),
  client_alias text not null default '',
  kind text not null check (kind in ('RFP','Pliego','Oportunidad','Otro')),
  stage text not null check (stage in ('Detectada','En estudio','Preparando oferta','Oferta presentada','Negociación','Ganada','Perdida')),
  amount numeric(15,2) not null default 0 check (amount >= 0),
  deadline date,
  decision_date date,
  notes text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 160),
  client_alias text not null default '',
  status text not null check (status in ('En curso','En pausa','Finalizado')),
  progress integer not null default 0 check (progress between 0 and 100),
  start_date date,
  target_date date,
  notes text not null default '',
  source_opportunity_id uuid,
  created_at timestamptz not null default now(),
  unique (owner_id, source_opportunity_id)
);

create index if not exists idx_cdc_opportunities_owner on public.opportunities(owner_id);
create index if not exists idx_cdc_projects_owner on public.projects(owner_id);

alter table public.opportunities enable row level security;
alter table public.projects enable row level security;

-- Ejecutable de nuevo sin duplicar políticas.
drop policy if exists "cdc_o_select" on public.opportunities;
drop policy if exists "cdc_o_insert" on public.opportunities;
drop policy if exists "cdc_o_update" on public.opportunities;
drop policy if exists "cdc_o_delete" on public.opportunities;
create policy "cdc_o_select" on public.opportunities for select to authenticated using (owner_id = (select auth.uid()));
create policy "cdc_o_insert" on public.opportunities for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "cdc_o_update" on public.opportunities for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "cdc_o_delete" on public.opportunities for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "cdc_p_select" on public.projects;
drop policy if exists "cdc_p_insert" on public.projects;
drop policy if exists "cdc_p_update" on public.projects;
drop policy if exists "cdc_p_delete" on public.projects;
create policy "cdc_p_select" on public.projects for select to authenticated using (owner_id = (select auth.uid()));
create policy "cdc_p_insert" on public.projects for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "cdc_p_update" on public.projects for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "cdc_p_delete" on public.projects for delete to authenticated using (owner_id = (select auth.uid()));

grant usage on schema public to authenticated;
grant select,insert,update,delete on public.opportunities,public.projects to authenticated;
-- De forma preventiva, no se conceden permisos de acceso a datos sin sesión.
revoke all on public.opportunities,public.projects from anon;
