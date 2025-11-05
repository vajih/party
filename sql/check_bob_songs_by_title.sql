-- ============================================================================
-- CHECK IF BOB'S SONGS STILL EXIST IN DATABASE
-- ============================================================================
-- Purpose: Search for Bob's three songs by their titles to see if they 
--          still exist (possibly with updated display_name or different user_id)
-- 
-- Songs to find:
-- 1. "Billie Jean" (had 4 votes)
-- 2. "Hawa Hawa" (had 2 votes)
-- 3. "Wake Me Up Before You Go-Go" (had 2 votes)
-- ============================================================================

-- Check for Bob's songs by title (in case user_id changed or display_name updated)
SELECT 
    id as submission_id,
    content->>'title' as title,
    content->>'artist' as artist,
    display_name,
    user_id,
    created_at,
    (SELECT COUNT(*) FROM votes WHERE submission_id = s.id) as vote_count
FROM submissions s
WHERE content->>'title' IN ('Billie Jean', 'Hawa Hawa', 'Wake Me Up Before You Go-Go')
ORDER BY created_at;

-- ============================================================================
-- INTERPRETATION OF RESULTS:
-- ============================================================================
-- If you see 3 rows:
--   ✅ Songs are preserved!
--   - Check display_name column: should be "Vajih Khan" if cleanup worked
--   - Check vote_count: should total 8 votes (4 + 2 + 2)
--   - Check user_id: will still be 422caa1b-60dc-4d3f-b90a-869865972478
--
-- If you see 0 rows:
--   ❌ Songs were deleted (likely when user was deleted from auth.users)
--   - This means the cleanup script didn't run, or ran after auth deletion
--   - Songs and votes are permanently lost unless you have a backup
-- ============================================================================
