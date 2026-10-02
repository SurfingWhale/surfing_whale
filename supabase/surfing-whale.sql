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

-- Photographs that stand on their own.
--
-- The library (Supabase Storage) holds the files. This holds the one thing a
-- file cannot: what the photograph is of. Without it a photograph could only
-- reach the site inside an essay or a post, which meant writing a piece to
-- show one frame — and the gallery on the home page was a hand-edited array in
-- the repository, so adding a photograph meant a commit.
--
-- `alt` is not optional on a published row. It is what a screen reader says
-- and the only thing search can read; the server refuses to publish without
-- it. Nothing else here is required.
create table if not exists public.surfingwhale_photos (
  -- The object's path in the bucket, e.g. "library/2026-10-02-….webp".
  public_id   text primary key check (public_id <> ''),
  alt         text not null default '',
  category    text not null default 'everyday'
              check (category in ('portraits','everyday','landscapes')),
  published   boolean not null default false,
  -- Denormalised from the object name so the public gallery is one select and
  -- never has to list the bucket with the service-role key.
  url         text not null default '',
  width       integer not null default 0,
  height      integer not null default 0,
  -- Lower sorts first; equal values fall back to newest.
  sort        integer not null default 0,
  taken_at    timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists surfingwhale_photos_published
  on public.surfingwhale_photos (published, sort, taken_at desc);

drop trigger if exists surfingwhale_photos_touch on public.surfingwhale_photos;
create trigger surfingwhale_photos_touch
  before update on public.surfingwhale_photos
  for each row execute function public.surfingwhale_touch();

alter table public.surfingwhale_photos enable row level security;
revoke all on public.surfingwhale_photos from anon, authenticated;
