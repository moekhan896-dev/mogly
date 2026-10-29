-- End of Summer Sale tracker (Aug 25 to Aug 31, 2026)
-- Namespaced _eos so it coexists with the memorial day, july4, and b2s tables.
-- Safe to run more than once.

create table if not exists leads_eos (
  id      integer primary key,
  name    text not null,
  phone   text,
  email   text,
  flags   jsonb default '[]'::jsonb,
  status  text default 'New',
  calls   jsonb default '[]'::jsonb,
  note    text default '',
  updated timestamptz default now()
);

create table if not exists sends_eos (
  idx     integer primary key,
  sent    integer,
  opens   integer,
  clicks  integer,
  replies integer,
  updated timestamptz default now()
);

alter table leads_eos enable row level security;
alter table sends_eos enable row level security;

drop policy if exists leads_eos_all on leads_eos;
drop policy if exists sends_eos_all on sends_eos;
create policy leads_eos_all on leads_eos for all using (true) with check (true);
create policy sends_eos_all on sends_eos for all using (true) with check (true);

-- Realtime. Guarded: "alter publication ... add table" errors if the table is
-- already a member, which breaks a second run of this script.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'leads_eos'
  ) then
    alter publication supabase_realtime add table leads_eos;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sends_eos'
  ) then
    alter publication supabase_realtime add table sends_eos;
  end if;
end
$$;
