-- The Retirement Planning Window seminar tracker
-- AWS Law Firm x Pelora Advisors, seminar Sat Nov 7 2026.
-- Namespaced _rpw so it coexists with the memorial day, july4, b2s and eos tables.
-- Safe to run more than once.

create table if not exists leads_rpw (
  id      integer primary key,
  name    text not null,
  phone   text,
  email   text,
  city    text default '',
  state   text default '',
  created text default '',
  flags   jsonb default '[]'::jsonb,
  status  text default 'New',
  source  text default '',
  calls   jsonb default '[]'::jsonb,
  note    text default '',
  updated timestamptz default now()
);

create table if not exists sends_rpw (
  idx     integer primary key,
  sent    integer,
  opens   integer,
  clicks  integer,
  replies integer,
  updated timestamptz default now()
);

-- Columns added after first release; harmless on a fresh table.
alter table leads_rpw add column if not exists city    text default '';
alter table leads_rpw add column if not exists state   text default '';
alter table leads_rpw add column if not exists created text default '';

alter table leads_rpw enable row level security;
alter table sends_rpw enable row level security;

drop policy if exists leads_rpw_all on leads_rpw;
drop policy if exists sends_rpw_all on sends_rpw;
create policy leads_rpw_all on leads_rpw for all using (true) with check (true);
create policy sends_rpw_all on sends_rpw for all using (true) with check (true);

-- Realtime. Guarded: "alter publication ... add table" errors if the table is
-- already a member, which breaks a second run of this script.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'leads_rpw'
  ) then
    alter publication supabase_realtime add table leads_rpw;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sends_rpw'
  ) then
    alter publication supabase_realtime add table sends_rpw;
  end if;
end
$$;
