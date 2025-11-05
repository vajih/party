-- ============================================
-- PRODUCTION-SAFE: MANUAL INSPECTION ONLY
-- Run these READ-ONLY queries to understand your data
-- DO NOT uncomment the DELETE sections until you've verified everything
-- ============================================

-- 🔍 STEP 1: List all beta users (adjust email pattern)
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email LIKE '%test%' 
   OR email LIKE '%beta%'
   OR email LIKE '%temp%'
ORDER BY created_at DESC;

-- Copy the user IDs and emails to a safe place (notepad/notes app)


-- 🔍 STEP 2: For ONE specific beta user, see ALL their data
-- Beta user: goseme8620@dwakm.com
WITH target_user AS (
  SELECT '11c50310-ae2c-45ff-82cd-e29d034f9685'::uuid as id
)
SELECT 
  '🎵 SONGS (KEEP)' as category,
  s.id::text as record_id,
  g.type as game_type,
  s.content->>'title' as song_title,
  s.display_name,
  (SELECT COUNT(*) FROM votes v WHERE v.submission_id = s.id)::text as vote_count
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = (SELECT id FROM target_user)
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  '🗳️ VOTES ON SONGS (KEEP)',
  v.id::text,
  g.type,
  (SELECT content->>'title' FROM submissions WHERE id = v.submission_id),
  NULL,
  NULL
FROM votes v
JOIN games g ON v.game_id = g.id
WHERE v.user_id = (SELECT id FROM target_user)
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  '📸 BABY PHOTOS (DELETE)',
  s.id::text,
  g.type,
  s.content->>'photo_url',
  s.display_name,
  NULL
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = (SELECT id FROM target_user)
  AND g.type = 'baby_photo'

UNION ALL

SELECT 
  '❓ ABOUT YOU (DELETE)',
  s.id::text,
  g.type,
  'about_you_answers',
  s.display_name,
  NULL
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = (SELECT id FROM target_user)
  AND g.type = 'about_you'

UNION ALL

SELECT 
  '👤 PROFILE (DELETE)',
  pp.party_id::text,
  'party_profile',
  pp.display_name,
  pp.birth_city,
  NULL
FROM party_profiles pp
WHERE pp.user_id = (SELECT id FROM target_user)

UNION ALL

SELECT 
  '🎭 HOST ROLE (DELETE)',
  ph.party_id::text,
  'party_host',
  (SELECT title FROM parties WHERE id = ph.party_id),
  NULL,
  NULL
FROM party_hosts ph
WHERE ph.user_id = (SELECT id FROM target_user);


-- 🔍 STEP 3: Count impact across ALL 6 beta users
-- Replace the UUIDs with your actual beta user IDs from Step 1
WITH beta_users AS (
  SELECT unnest(ARRAY[
    'USER_ID_1'::uuid,
    'USER_ID_2'::uuid,
    'USER_ID_3'::uuid,
    'USER_ID_4'::uuid,
    'USER_ID_5'::uuid,
    'USER_ID_6'::uuid
  ]) as id
)
SELECT 
  '📊 Total beta users' as metric,
  COUNT(DISTINCT id)::text as count
FROM beta_users

UNION ALL

SELECT 
  '🎵 Songs to KEEP',
  COUNT(*)::text
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id IN (SELECT id FROM beta_users)
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  '🗳️ Song votes to KEEP',
  COUNT(*)::text
FROM votes v
JOIN games g ON v.game_id = g.id
WHERE v.user_id IN (SELECT id FROM beta_users)
  AND g.type = 'favorite_song'

UNION ALL

SELECT 
  '❌ Records to DELETE',
  (
    (SELECT COUNT(*) FROM submissions s 
     WHERE s.user_id IN (SELECT id FROM beta_users) 
     AND s.game_id IN (SELECT id FROM games WHERE type != 'favorite_song'))
    +
    (SELECT COUNT(*) FROM votes v 
     WHERE v.user_id IN (SELECT id FROM beta_users) 
     AND v.game_id IN (SELECT id FROM games WHERE type != 'favorite_song'))
    +
    (SELECT COUNT(*) FROM party_profiles 
     WHERE user_id IN (SELECT id FROM beta_users))
    +
    (SELECT COUNT(*) FROM party_hosts 
     WHERE user_id IN (SELECT id FROM beta_users))
  )::text;


-- ✅ DECISION CHECKPOINT
-- Review the output above:
-- 1. Do the song titles look correct?
-- 2. Are vote counts reasonable?
-- 3. Is the DELETE count expected?
-- 
-- If YES to all → Proceed to cleanup_beta_production_SAFE.sql
-- If NO to any → STOP and investigate
