/* De Vie Tasks, v2: sections inside a list, plus the Set Up and Close Down lists. */
/* Run after tasks_v1. v1 is not edited: a revision is a new file. */

create table if not exists public.task_sections (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.task_lists (id) on delete cascade,
  name        text not null,
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (list_id, name)
);

/* A check may sit in a section. No section means it is listed first, ungrouped. */
alter table public.task_items add column if not exists section_id uuid references public.task_sections (id) on delete cascade;
create index if not exists task_items_section_idx on public.task_items (section_id, sort_order);

alter table public.task_sections enable row level security;
grant select, insert, update, delete on public.task_sections to authenticated;

drop policy if exists "task_sections select" on public.task_sections;
drop policy if exists "task_sections insert" on public.task_sections;
drop policy if exists "task_sections update" on public.task_sections;
drop policy if exists "task_sections delete" on public.task_sections;
create policy "task_sections select" on public.task_sections for select to authenticated using (public.has_tasks_access());
create policy "task_sections insert" on public.task_sections for insert to authenticated with check (public.has_tasks_access());
create policy "task_sections update" on public.task_sections for update to authenticated using (public.has_tasks_access()) with check (public.has_tasks_access());
create policy "task_sections delete" on public.task_sections for delete to authenticated using (public.has_tasks_access());

/* The two lists, every day to start with (change the days in Manage). */
insert into public.task_lists (name, kind, days, sort_order)
select 'Set Up', 'opening', array[1,2,3,4,5,6,7], 1
where not exists (select 1 from public.task_lists where name = 'Set Up');

insert into public.task_lists (name, kind, days, sort_order)
select 'Close Down', 'closing', array[1,2,3,4,5,6,7], 2
where not exists (select 1 from public.task_lists where name = 'Close Down');

/* Five sections in each. */
insert into public.task_sections (list_id, name, sort_order)
select l.id, s.name, s.ord
from public.task_lists l
cross join (values ('Winter', 1), ('Spring', 2), ('Summer', 3), ('Autumn', 4), ('Kitchen', 5)) as s(name, ord)
where l.name in ('Set Up', 'Close Down')
on conflict (list_id, name) do nothing;
