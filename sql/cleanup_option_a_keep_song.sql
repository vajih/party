-- ============================================
-- OPTION A: KEEP SONG, DELETE PHOTO & PROFILE
-- User: goseme8620@dwakm.com
-- ID: 11c50310-ae2c-45ff-82cd-e29d034f9685
-- ============================================
-- This will:
--   ✅ KEEP: Song "Aaj Jaane Ki Zid Na Karo" + 8 votes
--   ✅ KEEP: User account in auth.users
--   ❌ DELETE: Baby photo submission
--   ❌ DELETE: Profile (Vajih Khan, Karachi)
-- ============================================

-- 🔍 STEP 1: FINAL PREVIEW
SELECT 
  '❌ Baby photo to DELETE' as action,
  s.id::text as record_id,
  s.content->>'photo_url' as details
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid
  AND g.type = 'baby_photo'

UNION ALL

SELECT 
  '❌ Profile to DELETE',
  pp.party_id::text,
  pp.display_name || ' from ' || pp.birth_city
FROM party_profiles pp
WHERE pp.user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid

UNION ALL

SELECT 
  '✅ Song to KEEP',
  s.id::text,
  s.content->>'title' || ' (' || (SELECT COUNT(*) FROM votes WHERE submission_id = s.id)::text || ' votes)'
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid
  AND g.type = 'favorite_song';

-- Review output above - should show 2 deletions, 1 kept


-- 🔥 STEP 2: EXECUTE CLEANUP
-- Uncomment when ready
/*
BEGIN;

-- Delete baby photo submission
DELETE FROM submissions
WHERE user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid
  AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo');

-- Expected: DELETE 1

-- Delete profile
DELETE FROM party_profiles
WHERE user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid;

-- Expected: DELETE 1

-- ⚠️ Check row counts above
-- Should see: DELETE 1, DELETE 1 (total 2 rows)
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
  '✅ Baby photo deleted' as check_item,
  COUNT(*)::text as count,
  'Expected: 0' as expected
FROM submissions
WHERE user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid
  AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo')

UNION ALL

SELECT 
  '✅ Profile deleted',
  COUNT(*)::text,
  'Expected: 0'
FROM party_profiles
WHERE user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid

UNION ALL

SELECT 
  '✅ Song still exists',
  COUNT(*)::text,
  'Expected: 1'
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  '✅ Votes preserved',
  COUNT(*)::text,
  'Expected: 8'
FROM votes
WHERE submission_id = '59746dae-8cce-40db-8a39-ed8b73ab7765'::uuid;
*/


-- 📝 NOTES:
-- - User account goseme8620@dwakm.com remains active in auth.users
-- - Song "Aaj Jaane Ki Zid Na Karo" stays with user_id linked
-- - Baby photo file remains in storage (manual cleanup if needed):
--   https://wzanrhtglteiqbnyxdwq.supabase.co/storage/v1/object/public/...
-- - No need to delete user from Supabase Auth Dashboard
