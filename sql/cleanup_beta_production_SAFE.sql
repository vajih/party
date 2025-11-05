-- ============================================
-- PRODUCTION CLEANUP: BETA USERS (KEEP SONGS)
-- ⚠️ THIS RUNS ON PRODUCTION - TRIPLE CHECK EVERYTHING
-- ============================================

-- ⚠️ MANDATORY: Run inspect_beta_users_production.sql FIRST
-- ⚠️ Verify all output looks correct before proceeding

-- 🎯 CONFIGURATION: Replace with your 6 beta user UUIDs
-- Get these from inspect_beta_users_production.sql Step 1
WITH beta_users AS (
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,  -- Replace with actual ID
    '00000000-0000-0000-0000-000000000002'::uuid,  -- Replace with actual ID
    '00000000-0000-0000-0000-000000000003'::uuid,  -- Replace with actual ID
    '00000000-0000-0000-0000-000000000004'::uuid,  -- Replace with actual ID
    '00000000-0000-0000-0000-000000000005'::uuid,  -- Replace with actual ID
    '00000000-0000-0000-0000-000000000006'::uuid   -- Replace with actual ID
  ]) as id
)
SELECT 
  '⚠️ WARNING: Beta users configured' as status,
  COUNT(*)::text as user_count,
  'Review UUIDs above before proceeding' as action
FROM beta_users;

-- ❌ STOP HERE - Review the output above
-- Confirm the count matches your 6 beta users


-- 📋 STEP 1: FINAL REVIEW (last chance to verify)
-- Uncomment to see exactly what will be affected
/*
WITH beta_users AS (
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid
  ]) as id
)
SELECT 
  'Songs that will be ANONYMIZED' as action,
  s.id as submission_id,
  s.content->>'title' as song_title,
  s.display_name as current_name,
  'Anonymous Beta User' as new_name,
  (SELECT COUNT(*) FROM votes WHERE submission_id = s.id) as votes_on_song
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id IN (SELECT id FROM beta_users)
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  'Baby photos that will be DELETED',
  s.id,
  s.content->>'photo_url',
  s.display_name,
  NULL,
  NULL
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id IN (SELECT id FROM beta_users)
  AND g.type = 'baby_photo'

UNION ALL

SELECT 
  'About You answers that will be DELETED',
  s.id,
  'answers',
  s.display_name,
  NULL,
  NULL
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id IN (SELECT id FROM beta_users)
  AND g.type = 'about_you'

UNION ALL

SELECT 
  'Profiles that will be DELETED',
  pp.id::text,
  pp.display_name,
  pp.birth_city,
  NULL,
  NULL
FROM party_profiles pp
WHERE pp.user_id IN (SELECT id FROM beta_users);
*/


-- 🔥 STEP 2: EXECUTE CLEANUP (DANGER ZONE)
-- Only uncomment if Step 1 review looks perfect
-- This uses a transaction so you can ROLLBACK if something looks wrong
/*
BEGIN;

WITH beta_users AS (
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,  -- ⚠️ MUST MATCH ABOVE
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid
  ]) as id
)
-- 2A: Anonymize song submissions (KEEP them but remove user link)
UPDATE submissions
SET 
  user_id = NULL,
  display_name = COALESCE(display_name, 'Anonymous Beta User'),
  content = jsonb_set(
    COALESCE(content, '{}'::jsonb),
    '{submitted_by_email}',
    '"[removed]"'::jsonb
  ),
  content = jsonb_set(
    content,
    '{submitted_by_name}',
    to_jsonb(COALESCE(display_name, 'Anonymous Beta User'))
  )
WHERE user_id IN (SELECT id FROM beta_users)
  AND game_id IN (SELECT id FROM games WHERE type = 'favorite_song');

-- Check rows affected (should match song count from inspection)
-- If this number looks wrong, run: ROLLBACK;

-- 2B: Delete baby photo submissions
DELETE FROM submissions
WHERE user_id IN (SELECT id FROM beta_users)
  AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo');

-- 2C: Delete about_you submissions
DELETE FROM submissions
WHERE user_id IN (SELECT id FROM beta_users)
  AND game_id IN (SELECT id FROM games WHERE type = 'about_you');

-- 2D: Delete non-song votes (keep song votes)
DELETE FROM votes
WHERE user_id IN (SELECT id FROM beta_users)
  AND game_id IN (SELECT id FROM games WHERE type != 'favorite_song');

-- 2E: Delete party profiles
DELETE FROM party_profiles
WHERE user_id IN (SELECT id FROM beta_users);

-- 2F: Delete party host entries
DELETE FROM party_hosts
WHERE user_id IN (SELECT id FROM beta_users);

-- ⚠️ CHECKPOINT: Review the "X rows affected" output above
-- If all numbers match your expectations:
COMMIT;

-- If anything looks wrong:
-- ROLLBACK;
*/


-- ✅ STEP 3: VERIFY CLEANUP WORKED
-- Run this AFTER committing Step 2
-- Replace UUIDs again
/*
WITH beta_user_ids AS (
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid
  ]) as id
)
SELECT 
  '✅ Anonymized songs (user_id=NULL)' as verification,
  COUNT(*)::text as count,
  'Should show your song count' as expected
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id IS NULL
  AND g.type = 'favorite_song'
  AND (s.display_name LIKE '%Anonymous%' OR s.display_name LIKE '%Beta%')

UNION ALL

SELECT 
  '✅ Song votes still exist',
  COUNT(*)::text,
  'Should match vote count'
FROM votes v
JOIN games g ON v.game_id = g.id
WHERE v.user_id IN (SELECT id FROM beta_user_ids)
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  '❌ Non-song data removed (should be 0)',
  COUNT(*)::text,
  '0'
FROM submissions s
WHERE s.user_id IN (SELECT id FROM beta_user_ids)

UNION ALL

SELECT 
  '❌ Profiles removed (should be 0)',
  COUNT(*)::text,
  '0'
FROM party_profiles pp
WHERE pp.user_id IN (SELECT id FROM beta_user_ids);
*/


-- 🗑️ STEP 4: DELETE USERS FROM AUTH (MANUAL - Supabase Dashboard)
-- After Steps 2 & 3 are successful:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. For EACH of the 6 beta user emails:
--    a. Search for the email
--    b. Click the "..." menu
--    c. Select "Delete user"
--    d. Confirm deletion
-- 3. Come back here and run Step 5


-- 🎉 STEP 5: FINAL VERIFICATION (after deleting from auth)
-- This confirms songs are visible and no orphans exist
/*
SELECT 
  '🎵 Songs visible in app' as final_check,
  COUNT(*) as count,
  string_agg(DISTINCT content->>'title', ', ') as sample_titles
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id IS NULL
  AND g.type = 'favorite_song'
  AND (s.display_name LIKE '%Anonymous%' OR s.display_name LIKE '%Beta%')
GROUP BY final_check

UNION ALL

SELECT 
  '✅ No orphaned data',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✓ Clean!' ELSE '⚠️ Found orphans - investigate!' END
FROM submissions s
WHERE s.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.user_id);
*/
