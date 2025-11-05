-- ============================================
-- TEST CLEANUP: SINGLE BETA USER (KEEP SONGS & VOTES)
-- This is a safe test script for ONE beta user
-- Test this first, then run the full cleanup
-- ============================================

-- 🎯 STEP 1: FIND THE BEST TEST CANDIDATE
-- Run this to see which beta user has the most complete data to test with
SELECT 
  u.email,
  u.id as user_id,
  (SELECT COUNT(*) FROM submissions s 
   JOIN games g ON s.game_id = g.id 
   WHERE s.user_id = u.id AND g.type = 'favorite_song') as song_count,
  (SELECT COUNT(*) FROM votes v 
   JOIN games g ON v.game_id = g.id 
   WHERE v.user_id = u.id AND g.type = 'favorite_song') as song_votes,
  (SELECT COUNT(*) FROM submissions s 
   JOIN games g ON s.game_id = g.id 
   WHERE s.user_id = u.id AND g.type != 'favorite_song') as other_submissions,
  (SELECT COUNT(*) FROM party_profiles pp WHERE pp.user_id = u.id) as profiles,
  (SELECT COUNT(*) FROM party_hosts ph WHERE ph.user_id = u.id) as host_entries
FROM auth.users u
WHERE u.email LIKE '%beta%' -- Adjust this pattern to match your beta user emails
   OR u.email IN (
     'test1@example.com',
     'test2@example.com'
     -- Add suspected beta emails here
   )
ORDER BY song_count DESC;

-- ⚠️ Pick a user with at least 1 song for meaningful testing


-- 📊 STEP 2: DETAILED PREVIEW FOR TEST USER
-- Replace 'beta1@example.com' with your chosen test user email
WITH test_user AS (
  SELECT id, email 
  FROM auth.users 
  WHERE email = 'beta1@example.com' -- ⚠️ CHANGE THIS
)
SELECT 
  'Test user found' as category, 
  1 as count,
  (SELECT email FROM test_user) as detail

UNION ALL

SELECT 
  '📁 Song submissions (WILL KEEP)', 
  COUNT(*),
  string_agg(content->>'title', ', ')
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = (SELECT id FROM test_user)
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  '🗳️ Votes on songs (WILL KEEP)', 
  COUNT(*),
  string_agg(DISTINCT v.submission_id::text, ', ')
FROM votes v
JOIN games g ON v.game_id = g.id
WHERE v.user_id = (SELECT id FROM test_user)
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  '❌ Non-song submissions (WILL DELETE)', 
  COUNT(*),
  string_agg(DISTINCT g.type, ', ')
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = (SELECT id FROM test_user)
  AND g.type != 'favorite_song'

UNION ALL

SELECT 
  '❌ Non-song votes (WILL DELETE)', 
  COUNT(*),
  NULL
FROM votes v
JOIN games g ON v.game_id = g.id
WHERE v.user_id = (SELECT id FROM test_user)
  AND g.type != 'favorite_song'

UNION ALL

SELECT 
  '❌ Party profiles (WILL DELETE)', 
  COUNT(*),
  string_agg(display_name, ', ')
FROM party_profiles pp
WHERE pp.user_id = (SELECT id FROM test_user)

UNION ALL

SELECT 
  '❌ Party hosts (WILL DELETE)', 
  COUNT(*),
  NULL
FROM party_hosts ph
WHERE ph.user_id = (SELECT id FROM test_user);


-- 🔄 STEP 3: TEST CLEANUP (ANONYMIZE SONGS + DELETE OTHER DATA)
-- Uncomment when ready to test
/*
BEGIN;

WITH test_user AS (
  SELECT id, email 
  FROM auth.users 
  WHERE email = 'beta1@example.com' -- ⚠️ CHANGE THIS
)
-- 3A: Anonymize song submissions
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
WHERE user_id = (SELECT id FROM test_user)
  AND game_id IN (SELECT id FROM games WHERE type = 'favorite_song');

-- 3B: Delete non-song submissions
DELETE FROM submissions
WHERE user_id = (SELECT id FROM test_user)
  AND game_id IN (SELECT id FROM games WHERE type != 'favorite_song');

-- 3C: Delete non-song votes
DELETE FROM votes
WHERE user_id = (SELECT id FROM test_user)
  AND game_id IN (SELECT id FROM games WHERE type != 'favorite_song');

-- 3D: Delete party profiles
DELETE FROM party_profiles
WHERE user_id = (SELECT id FROM test_user);

-- 3E: Delete party hosts
DELETE FROM party_hosts
WHERE user_id = (SELECT id FROM test_user);

COMMIT;
*/


-- 🔍 STEP 4: VERIFY TEST RESULTS
-- Run AFTER Step 3 to confirm changes
WITH test_user AS (
  SELECT id, email 
  FROM auth.users 
  WHERE email = 'beta1@example.com' -- ⚠️ CHANGE THIS
)
SELECT 
  '✅ Songs with user_id=NULL' as check_item, 
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN 'PASS ✓' ELSE 'FAIL (no songs found)' END as status
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id IS NULL
  AND g.type = 'favorite_song'
  AND s.display_name LIKE '%Anonymous%' -- Check for anonymized name

UNION ALL

SELECT 
  '✅ Votes still exist',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN 'PASS ✓' ELSE 'INFO (user had no votes)' END
FROM votes v
JOIN games g ON v.game_id = g.id
WHERE v.user_id = (SELECT id FROM test_user)
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  '❌ Non-song data removed',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN 'PASS ✓' ELSE 'FAIL (data remains)' END
FROM submissions s
WHERE s.user_id = (SELECT id FROM test_user)
  AND s.game_id IN (SELECT id FROM games WHERE type != 'favorite_song')

UNION ALL

SELECT 
  '❌ Profile removed',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN 'PASS ✓' ELSE 'FAIL (profile remains)' END
FROM party_profiles pp
WHERE pp.user_id = (SELECT id FROM test_user);


-- 🗑️ STEP 5: DELETE TEST USER FROM AUTH
-- Do this MANUALLY in Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Search for: beta1@example.com
-- 3. Click "..." menu > Delete user
-- 4. Confirm deletion


-- ✅ STEP 6: FINAL VERIFICATION (AFTER AUTH DELETION)
-- This checks that songs are still visible without causing orphan warnings
SELECT 
  'Songs visible in app' as check_item,
  COUNT(*) as count,
  string_agg(content->>'title', ', ') as song_titles
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id IS NULL
  AND g.type = 'favorite_song'
  AND s.display_name LIKE '%Anonymous%'
GROUP BY check_item

UNION ALL

SELECT 
  'No orphaned submissions',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ Clean!' ELSE '⚠️ Found orphans' END
FROM submissions s
WHERE s.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.user_id);
