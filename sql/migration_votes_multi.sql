-- Migration: Allow multiple votes per user per game (up to 5)
-- Drop old constraint that only allowed 1 vote per user per game
drop index if exists public.uniq_votes_user_per_game;

-- Create new constraint: one vote per user per submission
create unique index if not exists uniq_votes_user_per_submission 
  on public.votes (user_id, submission_id);

-- Add a delete policy for votes so users can unvote
drop policy if exists votes_delete on public.votes;
create policy votes_delete on public.votes for delete using (auth.uid() = user_id);
