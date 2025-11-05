-- ============================================================================
-- FIX SONG TITLE TYPO FOR USER 5c25f46b-6f17-45b6-a3d1-2fe7f142d4f8
-- ============================================================================
-- Current: "#42"
-- Corrected: "#41"
-- Party: friendsgiving2025-1ty7
-- ============================================================================

-- Step 1: VERIFY - Find the current song submission
-- This should show you the current song data with the typo
SELECT 
    s.id AS submission_id,
    s.user_id,
    s.display_name,
    s.content->>'title' AS current_title,
    s.content->>'artist' AS artist,
    s.content->>'spotify_url' AS spotify_url,
    s.content AS full_content,
    s.created_at
FROM submissions s
JOIN games g ON s.game_id = g.id
JOIN parties p ON s.party_id = p.id
WHERE s.user_id = '5c25f46b-6f17-45b6-a3d1-2fe7f142d4f8'
  AND p.slug = 'friendsgiving2025-1ty7'
  AND g.type = 'favorite_song';

-- ============================================================================
-- Step 2: UPDATE - Fix the song title typo
-- ============================================================================
-- IMPORTANT: Review the data above before uncommenting and running this!
-- ============================================================================

/*
UPDATE submissions
SET content = jsonb_set(
    content,
    '{title}',
    '"#41"'::jsonb
)
WHERE id IN (
    SELECT s.id
    FROM submissions s
    JOIN games g ON s.game_id = g.id
    JOIN parties p ON s.party_id = p.id
    WHERE s.user_id = '5c25f46b-6f17-45b6-a3d1-2fe7f142d4f8'
      AND p.slug = 'friendsgiving2025-1ty7'
      AND g.type = 'favorite_song'
)
RETURNING 
    id,
    display_name,
    content->>'title' AS new_title,
    content->>'artist' AS artist,
    created_at;
*/

-- ============================================================================
-- Step 3: VERIFY - Confirm the change
-- ============================================================================
-- Uncomment this after running the UPDATE to verify the fix
-- ============================================================================

/*
SELECT 
    s.id AS submission_id,
    s.user_id,
    s.display_name,
    s.content->>'title' AS corrected_title,
    s.content->>'artist' AS artist,
    s.content->>'spotify_url' AS spotify_url,
    s.created_at
FROM submissions s
JOIN games g ON s.game_id = g.id
JOIN parties p ON s.party_id = p.id
WHERE s.user_id = '5c25f46b-6f17-45b6-a3d1-2fe7f142d4f8'
  AND p.slug = 'friendsgiving2025-1ty7'
  AND g.type = 'favorite_song';
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- If you need to undo the change and restore "#42", uncomment and run:
-- ============================================================================

/*
UPDATE submissions
SET content = jsonb_set(
    content,
    '{title}',
    '"#42"'::jsonb
)
WHERE id IN (
    SELECT s.id
    FROM submissions s
    JOIN games g ON s.game_id = g.id
    JOIN parties p ON s.party_id = p.id
    WHERE s.user_id = '5c25f46b-6f17-45b6-a3d1-2fe7f142d4f8'
      AND p.slug = 'friendsgiving2025-1ty7'
      AND g.type = 'favorite_song'
)
RETURNING 
    id,
    content->>'title' AS restored_title;
*/

-- ============================================================================
-- INSTRUCTIONS:
-- ============================================================================
-- 1. Run Step 1 (VERIFY) to see the current song data
-- 2. Confirm it shows song_title: "#42" for the correct user
-- 3. Uncomment Step 2 (UPDATE) and run it to fix the typo
-- 4. Uncomment Step 3 (VERIFY) and run it to confirm the change
-- 5. If needed, use the ROLLBACK section to restore the original
-- ============================================================================
