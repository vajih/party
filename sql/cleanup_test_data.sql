-- Clean up test data from FriendsGiving2025 party
-- Run this to remove all fake test users and keep only real submissions

DO $$
DECLARE
  v_party_id uuid := '55d89369-7e85-4b8b-99b6-213d4d8ed489';
  v_deleted_profiles int;
  v_deleted_submissions int;
BEGIN
  -- Delete party_profiles for users not in auth.users (test data)
  DELETE FROM party_profiles 
  WHERE party_id = v_party_id
    AND user_id NOT IN (SELECT id FROM auth.users);
  
  GET DIAGNOSTICS v_deleted_profiles = ROW_COUNT;
  
  -- Delete submissions for users not in auth.users (test data)
  DELETE FROM submissions
  WHERE party_id = v_party_id
    AND user_id NOT IN (SELECT id FROM auth.users);
  
  GET DIAGNOSTICS v_deleted_submissions = ROW_COUNT;
  
  RAISE NOTICE 'Cleanup complete!';
  RAISE NOTICE 'Deleted % party_profiles', v_deleted_profiles;
  RAISE NOTICE 'Deleted % submissions', v_deleted_submissions;
END $$;

-- Verify remaining data
SELECT 
  'party_profiles' as table_name,
  COUNT(*) as remaining_records
FROM party_profiles
WHERE party_id = '55d89369-7e85-4b8b-99b6-213d4d8ed489'

UNION ALL

SELECT 
  'submissions' as table_name,
  COUNT(*) as remaining_records
FROM submissions
WHERE party_id = '55d89369-7e85-4b8b-99b6-213d4d8ed489';
