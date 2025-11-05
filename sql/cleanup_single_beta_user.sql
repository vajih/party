-- ============================================
-- PRODUCTION CLEANUP: SINGLE BETA USER TEST
-- User: goseme8620@dwakm.com
-- ID: 11c50310-ae2c-45ff-82cd-e29d034f9685
-- ============================================
-- This script will:
--   ✅ KEEP: 1 song "Aaj Jaane Ki Zid Na Karo" (8 votes) - ANONYMIZE it
--   ❌ DELETE: 1 baby photo
--   ❌ DELETE: 1 profile (Vajih Khan, Karachi)
-- ============================================

-- ⚠️ STEP 1: FINAL PREVIEW (what will happen)
-- Run this first to confirm one last time
WITH target_user AS (
  SELECT '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid as id
)
SELECT 
  '📋 FINAL PREVIEW' as action,
  '---' as details,
  '---' as notes
  
UNION ALL

SELECT 
  '✅ Anonymize Song',
  s.content->>'title',
  'user_id will be NULL, email removed, display_name kept'
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = (SELECT id FROM target_user)
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  '❌ Delete Baby Photo',
  s.content->>'photo_url',
  'Photo file will remain in storage (manual cleanup needed)'
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = (SELECT id FROM target_user)
  AND g.type = 'baby_photo'

UNION ALL

SELECT 
  '❌ Delete Profile',
  pp.display_name || ' from ' || pp.birth_city,
  'All profile data removed'
FROM party_profiles pp
WHERE pp.user_id = (SELECT id FROM target_user);


-- ⚠️ REVIEW THE OUTPUT ABOVE CAREFULLY ⚠️
-- If everything looks correct, proceed to Step 2


-- 🔥 STEP 2: EXECUTE CLEANUP (uncomment when ready)
-- This uses a transaction - you can ROLLBACK if something looks wrong
/*
BEGIN;

-- 2A: Anonymize the song submission
UPDATE submissions
SET 
  user_id = NULL,
  display_name = 'Vajih Khan',  -- Keep the display name
  content = jsonb_set(
    content,
    '{submitted_by_email}',
    '"[removed]"'::jsonb
  ),
  content = jsonb_set(
    content,
    '{submitted_by_name}',
    '"Vajih Khan"'::jsonb
  )
WHERE user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid
  AND game_id IN (SELECT id FROM games WHERE type = 'favorite_song');

-- Expected: 1 row affected
-- If you see a different number, run: ROLLBACK;


-- 2B: Delete baby photo submission
DELETE FROM submissions
WHERE user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid
  AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo');

-- Expected: 1 row affected


-- 2C: Delete profile
DELETE FROM party_profiles
WHERE user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid;

-- Expected: 1 row affected


-- ⚠️ CHECKPOINT: Review the "X rows affected" above
-- Total expected: 3 rows affected (1 update + 2 deletes)
-- 
-- If all numbers match:
COMMIT;
-- 
-- If anything looks wrong:
-- ROLLBACK;
*/


-- ✅ STEP 3: VERIFY CLEANUP (run after COMMIT)
/*
SELECT 
  '✅ Song anonymized (user_id=NULL)' as check_item,
  COUNT(*)::text as count,
  'Expected: 1' as expected
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id IS NULL
  AND g.type = 'favorite_song'
  AND s.content->>'title' = 'Aaj Jaane Ki Zid Na Karo'

UNION ALL

SELECT 
  '✅ Song votes preserved',
  COUNT(*)::text,
  'Expected: 8'
FROM votes v
WHERE v.submission_id = '59746dae-8cce-40db-8a39-ed8b73ab7765'::uuid

UNION ALL

SELECT 
  '❌ Baby photo deleted',
  COUNT(*)::text,
  'Expected: 0'
FROM submissions
WHERE user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid
  AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo')

UNION ALL

SELECT 
  '❌ Profile deleted',
  COUNT(*)::text,
  'Expected: 0'
FROM party_profiles
WHERE user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid;
*/


-- 🗑️ STEP 4: DELETE USER FROM AUTH (MANUAL)
-- After Steps 2 & 3 are successful:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Search for: goseme8620@dwakm.com
-- 3. Click "..." menu → "Delete user"
-- 4. Confirm deletion
-- 5. Return here and run Step 5


-- 🎉 STEP 5: FINAL VERIFICATION (after auth deletion)
/*
SELECT 
  '🎵 Song still visible' as final_check,
  s.content->>'title' as song_title,
  s.display_name,
  (SELECT COUNT(*) FROM votes WHERE submission_id = s.id)::text as votes
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id IS NULL
  AND g.type = 'favorite_song'
  AND s.content->>'title' = 'Aaj Jaane Ki Zid Na Karo'

UNION ALL

SELECT 
  '✅ No orphaned submissions',
  COUNT(*)::text,
  CASE WHEN COUNT(*) = 0 THEN '✓ Clean!' ELSE '⚠️ Issue!' END,
  NULL
FROM submissions s
WHERE s.user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid;
*/


-- 📝 CLEANUP NOTES:
-- - Baby photo file will remain in storage at: /storage/v1/object/public/party-media/...
--   You can manually delete it from Supabase Storage if needed
-- - The song "Aaj Jaane Ki Zid Na Karo" will remain visible with 8 votes
-- - Display name "Vajih Khan" is preserved on the song submission
