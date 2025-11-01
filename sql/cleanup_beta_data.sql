-- ============================================
-- CLEAN ALL BETA TEST DATA
-- WARNING: This will delete ALL parties, games, and user data
-- Use this to reset your app for production launch
-- ============================================

-- Step 1: Delete all party-related data (respects foreign key constraints)
DELETE FROM votes;
DELETE FROM submissions;
DELETE FROM party_profiles;
DELETE FROM games;
DELETE FROM party_hosts;
DELETE FROM parties;

-- Step 2: Optionally delete all auth users
-- ⚠️ UNCOMMENT BELOW ONLY IF YOU WANT TO DELETE ALL USER ACCOUNTS
-- This is IRREVERSIBLE - users will need to re-register
/*
DELETE FROM auth.users WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email NOT LIKE '%@yourdomain.com'  -- Protect your admin accounts
);
*/

-- Alternative: Delete only specific test users
-- DELETE FROM auth.users WHERE email IN (
--   'testuser1@example.com',
--   'testuser2@example.com'
-- );

-- Step 3: Verification - should show 0 for all tables
SELECT 
  'parties' as table_name, COUNT(*) as record_count FROM parties
UNION ALL
SELECT 'party_hosts', COUNT(*) FROM party_hosts
UNION ALL
SELECT 'games', COUNT(*) FROM games
UNION ALL
SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL
SELECT 'votes', COUNT(*) FROM votes
UNION ALL
SELECT 'party_profiles', COUNT(*) FROM party_profiles
UNION ALL
SELECT 'auth_users', COUNT(*) FROM auth.users;

-- Optional: Reset sequences (if you're using them)
-- ALTER SEQUENCE IF EXISTS some_sequence RESTART WITH 1;
