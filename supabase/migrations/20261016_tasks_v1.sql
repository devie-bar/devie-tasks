/* De Vie Tasks (tasks.devie.bar), v1. Not applied by the app repo: the lead applies it. */
/* Recurring checks for the bar (opening, closing, anything else on a weekly pattern). */
/* Three tables in public, gated to anyone with a row in public.profiles, like Handovers. */
/* A revision is a new file (v2, v3), never an edit to this one. */

create or replace function public.has_tasks_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid());
$$;
revoke all on function public.has_tasks_access() from public;
grant execute on function public.has_tasks_access() to authenticated;

/* A checklist: Opening, Closing, Weekly Deep Clean. */
create table if not exists public.task_lists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  kind        text not null default 'other' check (kind in ('opening', 'closing', 'other')),
  /* ISO weekdays the list runs on: 1 = Monday ... 7 = Sunday */
  days        int[] not null default '{1,2,3,4,5,6,7}',
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

/* One check on a list. */
create table if not exists public.task_items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.task_lists (id) on delete cascade,
  title       text not null,
  detail      text,
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists task_items_list_idx on public.task_items (list_id, sort_order);

/* A tick: one row per item per service date. Un-ticking deletes the row. */
create table if not exists public.task_completions (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references public.task_items (id) on delete cascade,
  service_date  date not null,
  done_by       text not null,
  done_at       timestamptz not null default now(),
  note          text,
  unique (item_id, service_date)
);
create index if not exists task_completions_date_idx on public.task_completions (service_date);

alter table public.task_lists        enable row level security;
alter table public.task_items        enable row level security;
alter table public.task_completions  enable row level security;

grant select, insert, update, delete on public.task_lists       to authenticated;
grant select, insert, update, delete on public.task_items       to authenticated;
grant select, insert, update, delete on public.task_completions to authenticated;

do $$
declare t text;
begin
  foreach t in array array['task_lists', 'task_items', 'task_completions'] loop
    execute format('drop policy if exists %I on public.%I', t || ' select', t);
    execute format('drop policy if exists %I on public.%I', t || ' insert', t);
    execute format('drop policy if exists %I on public.%I', t || ' update', t);
    execute format('drop policy if exists %I on public.%I', t || ' delete', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.has_tasks_access())', t || ' select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_tasks_access())', t || ' insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_tasks_access()) with check (public.has_tasks_access())', t || ' update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_tasks_access())', t || ' delete', t);
  end loop;
end
$$;

/* DELETE events must carry service_date so a phone can match an untick to its night. */
alter table public.task_completions replica identity full;

/* Realtime: several phones tick the same night's checks. */
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'task_completions') then
    alter publication supabase_realtime add table public.task_completions;
  end if;
end
$$;
