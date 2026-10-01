-- Surfing Whale — essays (the darkroom) and posts (writing).
--
-- Run once in Supabase → SQL Editor. Safe to run again: every statement is
-- "if not exists" or "or replace".
--
-- The project may be shared with other sites, so every name carries the
-- surfingwhale_ prefix. Row-level security is on with no policies at all:
-- the anon and publishable keys can neither read nor write these tables. Only
-- the service-role key, which lives on this site's server and nowhere else,
-- can — and the server checks the studio session before it uses it.

create table if not exists public.surfingwhale_essays (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug <> ''),
  title       text not null default '',
  subtitle    text not null default '',
  date        date not null default current_date,
  published   boolean not null default false,
  cover       text not null default '',
  count       integer not null default 0,
  -- Rows of text and photographs, in publishing order. The shape is checked
  -- by the server before it is written (app/api/darkroom/essay/route.ts).
  blocks      jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.surfingwhale_posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug <> ''),
  title       text not null default '',
  standfirst  text not null default '',
  date        date not null default current_date,
  published   boolean not null default false,
  cover       text not null default '',
  words       integer not null default 0,
  blocks      jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- The public pages ask for one thing: published, newest first.
create index if not exists surfingwhale_essays_published_date
  on public.surfingwhale_essays (published, date desc);
create index if not exists surfingwhale_posts_published_date
  on public.surfingwhale_posts (published, date desc);

create or replace function public.surfingwhale_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists surfingwhale_essays_touch on public.surfingwhale_essays;
create trigger surfingwhale_essays_touch
  before update on public.surfingwhale_essays
  for each row execute function public.surfingwhale_touch();

drop trigger if exists surfingwhale_posts_touch on public.surfingwhale_posts;
create trigger surfingwhale_posts_touch
  before update on public.surfingwhale_posts
  for each row execute function public.surfingwhale_touch();

alter table public.surfingwhale_essays enable row level security;
alter table public.surfingwhale_posts enable row level security;

-- Belt and braces on top of RLS: the public roles hold no grants on these.
revoke all on public.surfingwhale_essays from anon, authenticated;
revoke all on public.surfingwhale_posts from anon, authenticated;
