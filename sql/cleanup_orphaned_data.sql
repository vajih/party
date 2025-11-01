-- ============================================
-- CLEANUP ORPHANED USER DATA
-- This script finds and deletes data from users who no longer exist in auth.users
-- Run this after deleting users from Supabase Auth dashboard
-- ============================================

-- Step 1: REVIEW - Find orphaned records (users deleted from auth but data remains)

SELECT 'Orphaned votes' as category, COUNT(*) as count
FROM votes v
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v.user_id)

UNION ALL

SELECT 'Orphaned submissions', COUNT(*)
FROM submissions s
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.user_id)

UNION ALL

SELECT 'Orphaned party_profiles', COUNT(*)
FROM party_profiles pp
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = pp.user_id)

UNION ALL

SELECT 'Orphaned party_hosts', COUNT(*)
FROM party_hosts ph
WHERE ph.user_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ph.user_id);

-- Step 2: See detailed list of orphaned user IDs
SELECT DISTINCT v.user_id, 'votes' as found_in
FROM votes v
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v.user_id)

UNION

SELECT DISTINCT s.user_id, 'submissions'
FROM submissions s
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.user_id)

UNION

SELECT DISTINCT pp.user_id, 'party_profiles'
FROM party_profiles pp
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = pp.user_id)

UNION

SELECT DISTINCT ph.user_id, 'party_hosts'
FROM party_hosts ph
WHERE ph.user_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ph.user_id)

ORDER BY user_id;

-- Step 3: DELETE orphaned data (uncomment when ready to clean up)
/*
BEGIN;

-- Delete votes from non-existent users
DELETE FROM votes
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = votes.user_id);

-- Delete submissions from non-existent users
DELETE FROM submissions
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = submissions.user_id);

-- Delete party profiles from non-existent users
DELETE FROM party_profiles
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = party_profiles.user_id);

-- Delete party hosts from non-existent users
DELETE FROM party_hosts
WHERE party_hosts.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = party_hosts.user_id);

COMMIT;
*/

-- Step 4: Verification - Run Step 1 again to confirm all orphaned data is gone
