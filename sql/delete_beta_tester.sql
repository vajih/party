-- Delete Beta Tester Data
-- This script safely removes a specific user and all their associated data

-- ⚠️ WARNING: This will permanently delete user data. Use with caution!
-- 
-- Usage:
-- 1. Replace 'USER_UUID_HERE' with the actual user_id (get from auth.users table)
-- 2. Review the SELECT queries first to see what will be deleted
-- 3. Run the DELETE statements
-- 4. Delete the user from Supabase Auth dashboard

-- Step 1: REVIEW - See what data exists for this user
-- Replace USER_UUID_HERE with the actual user_id

SELECT 'votes' as table_name, count(*) as count 
FROM votes WHERE user_id = 'USER_UUID_HERE'
UNION ALL
SELECT 'submissions', count(*) 
FROM submissions WHERE user_id = 'USER_UUID_HERE'
UNION ALL
SELECT 'party_profiles', count(*) 
FROM party_profiles WHERE user_id = 'USER_UUID_HERE'
UNION ALL
SELECT 'party_hosts', count(*) 
FROM party_hosts WHERE user_id = 'USER_UUID_HERE';

-- Step 2: DELETE - Remove all user data (uncomment when ready)
/*
BEGIN;

DELETE FROM votes WHERE user_id = 'USER_UUID_HERE';
DELETE FROM submissions WHERE user_id = 'USER_UUID_HERE';
DELETE FROM party_profiles WHERE user_id = 'USER_UUID_HERE';
DELETE FROM party_hosts WHERE user_id = 'USER_UUID_HERE';

COMMIT;
*/

-- Step 3: Go to Supabase Dashboard > Authentication > Users
--         Find the user and click the trash icon to delete

-- Alternative: Get list of all users to find the one to delete
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
