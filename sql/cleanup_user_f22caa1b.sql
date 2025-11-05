-- ============================================
-- OPTION D: UPDATE SONGS, DELETE PROFILE & PHOTO
-- Beta User ID: f22caa1b-60dc-4d3f-b90a-8698b5972478
-- ============================================
-- This will:
--   ✅ UPDATE: Songs display_name → "Vajih Khan"
--   ✅ KEEP: Songs + votes
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
WHERE s.user_id = 'f22caa1b-60dc-4d3f-b90a-8698b5972478'::uuid
  AND g.type = 'baby_photo'

UNION ALL

SELECT 
  '❌ Profile to DELETE',
  pp.party_id::text,
  pp.display_name || ' from ' || pp.birth_city
FROM party_profiles pp
WHERE pp.user_id = 'f22caa1b-60dc-4d3f-b90a-8698b5972478'::uuid

UNION ALL

SELECT 
  '✅ Songs to KEEP',
  s.id::text,
  s.content->>'title' || ' by ' || s.display_name || ' (' || 
  (SELECT COUNT(*) FROM votes WHERE submission_id = s.id)::text || ' votes)'
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = 'f22caa1b-60dc-4d3f-b90a-8698b5972478'::uuid
  AND g.type = 'favorite_song'
ORDER BY action DESC;

-- Review output above - should show deletions and songs to keep


-- 🔥 STEP 2: EXECUTE CLEANUP
-- Uncomment when ready
/*
BEGIN;

-- Update song display names to "Vajih Khan"
UPDATE submissions
SET display_name = 'Vajih Khan'
WHERE user_id = 'f22caa1b-60dc-4d3f-b90a-8698b5972478'::uuid
  AND game_id IN (SELECT id FROM games WHERE type = 'favorite_song');

-- Expected: UPDATE X (number of songs)

-- Delete baby photo submission
DELETE FROM submissions
WHERE user_id = 'f22caa1b-60dc-4d3f-b90a-8698b5972478'::uuid
  AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo');

-- Expected: DELETE 1 or 0

-- Delete profile (including About You answers)
DELETE FROM party_profiles
WHERE user_id = 'f22caa1b-60dc-4d3f-b90a-8698b5972478'::uuid;

-- Expected: DELETE 1 or 0

-- ⚠️ Check row counts above
-- If numbers look correct:
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
  'Check song names' as expected
FROM submissions
WHERE user_id = 'f22caa1b-60dc-4d3f-b90a-8698b5972478'::uuid
  AND game_id IN (SELECT id FROM games WHERE type = 'favorite_song')
  AND display_name = 'Vajih Khan'

UNION ALL

SELECT 
  '✅ Baby photo deleted',
  COUNT(*)::text,
  'Expected: 0'
FROM submissions
WHERE user_id = 'f22caa1b-60dc-4d3f-b90a-8698b5972478'::uuid
  AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo')

UNION ALL

SELECT 
  '✅ Profile deleted',
  COUNT(*)::text,
  'Expected: 0'
FROM party_profiles
WHERE user_id = 'f22caa1b-60dc-4d3f-b90a-8698b5972478'::uuid

UNION ALL

SELECT 
  '✅ Songs still exist',
  COUNT(*)::text,
  'Check preserved'
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = 'f22caa1b-60dc-4d3f-b90a-8698b5972478'::uuid
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  '✅ Votes preserved',
  COUNT(*)::text,
  'All votes intact'
FROM votes
WHERE submission_id IN (
  SELECT s.id FROM submissions s
  WHERE s.user_id = 'f22caa1b-60dc-4d3f-b90a-8698b5972478'::uuid
  AND s.game_id IN (SELECT id FROM games WHERE type = 'favorite_song')
);
*/


-- 📝 NOTES:
-- - User account remains active (no auth deletion)
-- - Songs preserved with updated display name
-- - All votes preserved
-- - User disappears from About You report and birth city map
-- - Baby photo file remains in storage (manual cleanup if needed)
