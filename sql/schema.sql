-- == Extensions ==
create extension if not exists pgcrypto;

-- == Parties ==
create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  host_id uuid not null,
  title text not null,
  description text,
  date timestamptz,
  venue text,
  slug text unique not null,
  expected_guests int
);

-- == Party hosts ==
create table if not exists public.party_hosts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  party_id uuid references public.parties(id) on delete cascade not null,
  user_id uuid,
  invite_email text,
  role text check (role in ('cohost','moderator')) default 'cohost'
);

-- == Games ==
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  party_id uuid references public.parties(id) on delete cascade not null,
  type text not null,
  title text,
  status text check (status in ('open','closed')) default 'open',
  description text,
  config jsonb default '{}'::jsonb
);

-- == Submissions ==
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  party_id uuid references public.parties(id) on delete cascade not null,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid not null,
  display_name text,
  content jsonb,
  moderation_status text check (moderation_status in ('pending','approved','rejected')) default 'pending',
  moderated_at timestamptz,
  moderated_by uuid
);

-- == Votes ==
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  party_id uuid references public.parties(id) on delete cascade not null,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid not null,
  submission_id uuid references public.submissions(id) on delete cascade not null
);
create unique index if not exists uniq_votes_user_per_game on public.votes (user_id, game_id);

-- == Party profiles ==
create table if not exists public.party_profiles (
  party_id uuid not null references public.parties(id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  zodiac_sign text,
  birth_city text,
  birth_lat double precision,
  birth_lng double precision,
  fav_dest_city text,
  fav_dest_lat double precision,
  fav_dest_lng double precision,
  theme jsonb,
  created_at timestamptz default now(),
  primary key (party_id, user_id)
);

-- == RPCs for charts/maps ==
create or replace function party_zodiac_counts(p_party_id uuid)
returns table (zodiac_sign text, count bigint)
language sql stable as $$
  select coalesce(zodiac_sign,'Prefer not to say') as zodiac_sign, count(*)::bigint
  from party_profiles where party_id = p_party_id
  group by 1 order by 2 desc;
$$;

create or replace function party_birth_points(p_party_id uuid)
returns table (birth_city text, birth_country text, birth_lat double precision, birth_lng double precision, count bigint)
language sql stable as $$
  select birth_city, null::text as birth_country, birth_lat, birth_lng, count(*)::bigint
  from party_profiles
  where party_id = p_party_id and birth_lat is not null and birth_lng is not null
  group by 1,2,3,4 order by 5 desc;
$$;

create or replace function party_dest_points(p_party_id uuid)
returns table (fav_dest_city text, fav_dest_country text, fav_dest_lat double precision, fav_dest_lng double precision, count bigint)
language sql stable as $$
  select fav_dest_city, null::text as fav_dest_country, fav_dest_lat, fav_dest_lng, count(*)::bigint
  from party_profiles
  where party_id = p_party_id and fav_dest_lat is not null and fav_dest_lng is not null
  group by 1,2,3,4 order by 5 desc;
$$;
