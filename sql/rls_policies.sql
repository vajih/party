-- Enable RLS
alter table public.parties         enable row level security;
alter table public.party_hosts     enable row level security;
alter table public.games           enable row level security;
alter table public.submissions     enable row level security;
alter table public.votes           enable row level security;
alter table public.party_profiles  enable row level security;

-- Parties
drop policy if exists parties_select on public.parties;
drop policy if exists parties_insert on public.parties;
drop policy if exists parties_update on public.parties;
drop policy if exists parties_delete on public.parties;

create policy parties_select on public.parties for select using (true);
create policy parties_insert on public.parties for insert with check (auth.uid() = host_id);
create policy parties_update on public.parties for update using (
    auth.uid() = host_id 
    or exists(select 1 from party_hosts h 
              where h.party_id = id 
              and h.user_id = auth.uid() 
              and h.role = 'cohost')
);
create policy parties_delete on public.parties for delete using (auth.uid() = host_id);

-- Party hosts
drop policy if exists party_hosts_select on public.party_hosts;
drop policy if exists party_hosts_insert on public.party_hosts;
drop policy if exists party_hosts_delete on public.party_hosts;

create policy party_hosts_select on public.party_hosts 
  for select using (
    exists(select 1 from parties p where p.id = party_id 
           and (p.host_id = auth.uid() 
                or exists(select 1 from party_hosts h 
                         where h.party_id = p.id 
                         and h.user_id = auth.uid() 
                         and h.role = 'cohost')))
  );
create policy party_hosts_insert on public.party_hosts
  for insert with check (
    exists(select 1 from parties p where p.id = party_id 
           and (p.host_id = auth.uid() 
                or exists(select 1 from party_hosts h 
                         where h.party_id = p.id 
                         and h.user_id = auth.uid() 
                         and h.role = 'cohost')))
  );
create policy party_hosts_delete on public.party_hosts
  for delete using (
    exists(select 1 from parties p where p.id = party_id 
           and (p.host_id = auth.uid() 
                or exists(select 1 from party_hosts h 
                         where h.party_id = p.id 
                         and h.user_id = auth.uid() 
                         and h.role = 'cohost')))
  );

-- Games
drop policy if exists games_select on public.games;
drop policy if exists games_insert on public.games;
drop policy if exists games_update on public.games;
drop policy if exists games_delete on public.games;

create policy games_select on public.games for select using (true);
create policy games_insert on public.games
  for insert with check (
    exists(select 1 from parties p where p.id = party_id 
           and (p.host_id = auth.uid() 
                or exists(select 1 from party_hosts h 
                         where h.party_id = p.id 
                         and h.user_id = auth.uid() 
                         and h.role = 'cohost')))
  );
create policy games_update on public.games
  for update using (
    exists(select 1 from parties p where p.id = party_id 
           and (p.host_id = auth.uid() 
                or exists(select 1 from party_hosts h 
                         where h.party_id = p.id 
                         and h.user_id = auth.uid()
                         and (h.role = 'cohost' or (h.role = 'moderator' and column_name = 'status')))))
  );
create policy games_delete on public.games
  for delete using (
    exists(select 1 from parties p where p.id = party_id 
           and (p.host_id = auth.uid() 
                or exists(select 1 from party_hosts h 
                         where h.party_id = p.id 
                         and h.user_id = auth.uid() 
                         and h.role = 'cohost')))
  );

-- Submissions
drop policy if exists submissions_select on public.submissions;
drop policy if exists submissions_insert on public.submissions;
drop policy if exists submissions_update_on_self on public.submissions;
drop policy if exists submissions_moderate on public.submissions;

create policy submissions_select on public.submissions for select using (true);
create policy submissions_insert on public.submissions for insert with check (auth.uid() = user_id);
create policy submissions_update_on_self on public.submissions for update using (auth.uid() = user_id);
create policy submissions_moderate on public.submissions
  for update using (
    exists(
      select 1
      from parties p
      join games g on g.party_id = p.id
      where g.id = game_id
        and (p.host_id = auth.uid()
             or exists(select 1 from party_hosts h
                       where h.party_id = p.id
                         and h.user_id = auth.uid()
                         and h.role in ('cohost','moderator')))
    )
  );

-- Votes
drop policy if exists votes_select on public.votes;
drop policy if exists votes_upsert on public.votes;
drop policy if exists votes_update on public.votes;

create policy votes_select on public.votes for select using (true);
create policy votes_upsert on public.votes for insert with check (auth.uid() = user_id);
create policy votes_update on public.votes for update using (auth.uid() = user_id);

-- Party profiles
drop policy if exists profiles_select on public.party_profiles;
drop policy if exists profiles_upsert on public.party_profiles;
drop policy if exists profiles_update on public.party_profiles;

create policy profiles_select on public.party_profiles for select using (true);
create policy profiles_upsert on public.party_profiles for insert with check (auth.uid() = user_id);
create policy profiles_update on public.party_profiles for update using (auth.uid() = user_id);
