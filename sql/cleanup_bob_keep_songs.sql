-- ============================================
-- OPTION D: UPDATE SONGS, DELETE PROFILE & PHOTO
-- Beta User: Bob
-- ID: 9c0c7ba1-43ee-47dc-a637-c7c2edad3b22
-- ============================================
-- This will:
--   ✅ UPDATE: 3 songs display_name from "Bob" → "Vajih Khan"
--   ✅ KEEP: Songs + 8 votes
--   ✅ KEEP: User account
--   ❌ DELETE: Baby photo
--   ❌ DELETE: Profile (including About You answers, birth city)
-- ============================================

-- 🔍 STEP 1: FINAL PREVIEW
SELECT 
  '❌ Baby photo to DELETE' as action,
  s.id::text as record_id,
  s.content->>'photo_url' as details
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = '9c0c7ba1-43ee-47dc-a637-c7c2edad3b22'::uuid
  AND g.type = 'baby_photo'

UNION ALL

SELECT 
  '❌ Profile to DELETE',
  pp.party_id::text,
  pp.display_name || ' from ' || pp.birth_city
FROM party_profiles pp
WHERE pp.user_id = '9c0c7ba1-43ee-47dc-a637-c7c2edad3b22'::uuid

UNION ALL

SELECT 
  '✅ Songs to KEEP',
  s.id::text,
  s.content->>'title' || ' by ' || s.display_name || ' (' || 
  (SELECT COUNT(*) FROM votes WHERE submission_id = s.id)::text || ' votes)'
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = '9c0c7ba1-43ee-47dc-a637-c7c2edad3b22'::uuid
  AND g.type = 'favorite_song'
ORDER BY action DESC;

-- Review output above - should show 1 photo DELETE, 1 profile DELETE, 3 songs KEEP


-- 🔥 STEP 2: EXECUTE CLEANUP
-- Uncomment when ready
/*
BEGIN;

-- Update song display names from "Bob" to "Vajih Khan"
UPDATE submissions
SET display_name = 'Vajih Khan'
WHERE user_id = '9c0c7ba1-43ee-47dc-a637-c7c2edad3b22'::uuid
  AND game_id IN (SELECT id FROM games WHERE type = 'favorite_song');

-- Expected: UPDATE 3

-- Delete baby photo submission
DELETE FROM submissions
WHERE user_id = '9c0c7ba1-43ee-47dc-a637-c7c2edad3b22'::uuid
  AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo');

-- Expected: DELETE 1

-- Delete profile (including About You answers)
DELETE FROM party_profiles
WHERE user_id = '9c0c7ba1-43ee-47dc-a637-c7c2edad3b22'::uuid;

-- Expected: DELETE 1

-- ⚠️ Check row counts above
-- Should see: UPDATE 3, DELETE 1, DELETE 1 (total 5 rows affected)
-- 
-- If correct:
COMMIT;
--
-- If wrong:
-- ROLLBACK;
*/


-- ✅ STEP 3: VERIFY (run after COMMIT)
/*
SELECT 
  '✅ Songs renamed to Vajih Khan' as check_item,
  COUNT(*)::text as count,
  'Expected: 3' as expected
FROM submissions
WHERE user_id = '9c0c7ba1-43ee-47dc-a637-c7c2edad3b22'::uuid
  AND game_id IN (SELECT id FROM games WHERE type = 'favorite_song')
  AND display_name = 'Vajih Khan'

UNION ALL

SELECT 
  '✅ Baby photo deleted',
  COUNT(*)::text,
  'Expected: 0'
FROM submissions
WHERE user_id = '9c0c7ba1-43ee-47dc-a637-c7c2edad3b22'::uuid
  AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo')

UNION ALL

SELECT 
  '✅ Profile deleted',
  COUNT(*)::text,
  'Expected: 0'
FROM party_profiles
WHERE user_id = '9c0c7ba1-43ee-47dc-a637-c7c2edad3b22'::uuid

UNION ALL

SELECT 
  '✅ Songs still exist',
  COUNT(*)::text,
  'Expected: 3'
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = '9c0c7ba1-43ee-47dc-a637-c7c2edad3b22'::uuid
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  '✅ Total votes preserved',
  COUNT(*)::text,
  'Expected: 8 (4+2+2)'
FROM votes
WHERE submission_id IN (
  SELECT s.id FROM submissions s
  WHERE s.user_id = '9c0c7ba1-43ee-47dc-a637-c7c2edad3b22'::uuid
  AND s.game_id IN (SELECT id FROM games WHERE type = 'favorite_song')
);
*/


-- 📝 NOTES:
-- - User account will remain active (no auth deletion needed)
-- - Songs "Billie Jean", "Hawa Hawa", "Wake Me Up Before You Go-Go" preserved
-- - All 8 votes across the 3 songs preserved
-- - Display name changed from "Bob" to "Vajih Khan" on each song submission
-- - User will disappear from About You report and birth city map
-- - Baby photo file remains in storage (manual cleanup if needed)
