-- ============================================
-- CLEANUP BETA USER DATA (KEEP SONGS & VOTES)
-- This script deletes beta user data but preserves their song submissions and votes
-- Safe for transitioning from beta to production
-- ============================================

-- IMPORTANT: Run this BEFORE deleting users from auth.users
-- This way we can still identify which submissions are songs vs other content

-- Step 1: REVIEW - See what will be affected
-- Replace the email list with your actual beta user emails
WITH beta_users AS (
  SELECT id, email 
  FROM auth.users 
  WHERE email IN (
    'beta1@example.com',
    'beta2@example.com',
    'beta3@example.com'
    -- Add all your beta user emails here
  )
)
SELECT 
  'Beta users found' as category, 
  COUNT(*) as count,
  string_agg(email, ', ') as emails
FROM beta_users

UNION ALL

SELECT 
  'Song submissions (WILL KEEP)', 
  COUNT(*),
  string_agg(DISTINCT s.display_name, ', ')
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id IN (SELECT id FROM beta_users)
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  'Votes on any songs (WILL KEEP)', 
  COUNT(*),
  NULL
FROM votes v
JOIN games g ON v.game_id = g.id
WHERE v.user_id IN (SELECT id FROM beta_users)
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  'Non-song submissions (WILL DELETE)', 
  COUNT(*),
  string_agg(DISTINCT g.type, ', ')
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id IN (SELECT id FROM beta_users)
  AND g.type != 'favorite_song'

UNION ALL

SELECT 
  'Votes on non-songs (WILL DELETE)', 
  COUNT(*),
  NULL
FROM votes v
JOIN games g ON v.game_id = g.id
WHERE v.user_id IN (SELECT id FROM beta_users)
  AND g.type != 'favorite_song'

UNION ALL

SELECT 
  'Party profiles (WILL DELETE)', 
  COUNT(*),
  NULL
FROM party_profiles pp
WHERE pp.user_id IN (SELECT id FROM beta_users)

UNION ALL

SELECT 
  'Party hosts (WILL DELETE)', 
  COUNT(*),
  NULL
FROM party_hosts ph
WHERE ph.user_id IN (SELECT id FROM beta_users);


-- Step 2: ANONYMIZE song submissions instead of deleting
-- This preserves songs but removes beta user association
/*
BEGIN;

WITH beta_users AS (
  SELECT id, email 
  FROM auth.users 
  WHERE email IN (
    'beta1@example.com',
    'beta2@example.com',
    'beta3@example.com'
    -- Add all your beta user emails here
  )
)
-- Anonymize song submissions - change user_id to NULL and update display name
UPDATE submissions
SET 
  user_id = NULL,
  display_name = COALESCE(display_name, 'Anonymous Beta User'),
  content = jsonb_set(
    content,
    '{submitted_by_email}',
    '"[removed]"'
  )
WHERE user_id IN (SELECT id FROM beta_users)
  AND game_id IN (SELECT id FROM games WHERE type = 'favorite_song');

COMMIT;
*/


-- Step 3: DELETE non-song data
/*
BEGIN;

WITH beta_users AS (
  SELECT id 
  FROM auth.users 
  WHERE email IN (
    'beta1@example.com',
    'beta2@example.com',
    'beta3@example.com'
    -- Add all your beta user emails here
  )
)
-- Delete non-song submissions
DELETE FROM submissions
WHERE user_id IN (SELECT id FROM beta_users)
  AND game_id IN (SELECT id FROM games WHERE type != 'favorite_song');

-- Delete non-song votes
DELETE FROM votes
WHERE user_id IN (SELECT id FROM beta_users)
  AND game_id IN (SELECT id FROM games WHERE type != 'favorite_song');

-- Delete party profiles
DELETE FROM party_profiles
WHERE user_id IN (SELECT id FROM beta_users);

-- Delete party hosts
DELETE FROM party_hosts
WHERE user_id IN (SELECT id FROM beta_users);

COMMIT;
*/


-- Step 4: AFTER Steps 2 & 3, manually delete users from Supabase Auth dashboard
-- The song submissions will remain with user_id = NULL

-- Step 5: VERIFICATION - Check what's left
WITH beta_user_ids AS (
  -- Since users are deleted from auth, manually list their IDs here for verification
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000000'::uuid
    -- Add beta user IDs here if you know them
  ]) as id
)
SELECT 
  'Remaining song submissions' as category,
  COUNT(*) as count
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE (s.user_id IS NULL OR s.user_id IN (SELECT id FROM beta_user_ids))
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  'Remaining votes on songs',
  COUNT(*)
FROM votes v
JOIN games g ON v.game_id = g.id
WHERE v.user_id IN (SELECT id FROM beta_user_ids)
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  'Remaining non-song data (should be 0)',
  COUNT(*)
FROM submissions s
WHERE s.user_id IN (SELECT id FROM beta_user_ids)
  AND s.game_id IN (SELECT id FROM games WHERE type != 'favorite_song');
