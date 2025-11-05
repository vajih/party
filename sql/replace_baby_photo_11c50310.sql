-- ============================================================
-- REPLACE BABY PHOTO FOR USER 11c50310-ae2c-45ff-82cd-e29d034f9685
-- PRODUCTION - USE WITH CAUTION
-- ============================================================

-- STEP 1: VERIFY USER EXISTS AND CHECK CURRENT PHOTO
-- Run this first to see what we're changing
SELECT 
    s.id as submission_id,
    s.user_id,
    s.display_name,
    s.content->>'photo_url' as current_photo_url,
    s.content,
    s.created_at,
    g.type as game_type
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'
AND g.type = 'baby_photo';

-- EXPECTED: Should return 1 row with the current photo details
-- ⚠️ STOP HERE - Review the results before proceeding!
-- ============================================================


-- STEP 2: UPDATE THE PHOTO URL
-- ⚠️ ONLY RUN THIS AFTER VERIFYING STEP 1 RESULTS
-- ⚠️ CURRENT PHOTO URL (FOR ROLLBACK):
--    https://wzanrhtglteiqbnyxdwq.supabase.co/storage/v1/object/public/party-media/baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/11c50310-ae2c-45ff-82cd-e29d034f9685_1762096434195.png
-- ⚠️ UNCOMMENT THE LINES BELOW WHEN READY:

/*
UPDATE submissions
SET content = jsonb_set(
    content, 
    '{photo_url}', 
    '"https://drive.google.com/uc?export=view&id=1wJtluaMWRNCO_RKpy2fegZb0Alv9C0r2"'
)
WHERE user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'
AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo')
RETURNING 
    id,
    display_name,
    content->>'photo_url' as new_photo_url,
    updated_at;
*/

-- EXPECTED: Should return 1 row showing the updated photo URL
-- ============================================================


-- STEP 3: VERIFY THE UPDATE
-- Run this after STEP 2 to confirm the change
-- ⚠️ UNCOMMENT THE LINES BELOW AFTER STEP 2:

/*
SELECT 
    s.id,
    s.display_name,
    s.content->>'photo_url' as photo_url,
    s.updated_at,
    g.type
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'
AND g.type = 'baby_photo';
*/

-- EXPECTED: Should show the new Google Drive URL
-- ============================================================


-- ROLLBACK PLAN (if needed):
-- If something goes wrong, you can restore the original Supabase Storage URL:
/*
UPDATE submissions
SET content = jsonb_set(
    content, 
    '{photo_url}', 
    '"https://wzanrhtglteiqbnyxdwq.supabase.co/storage/v1/object/public/party-media/baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/11c50310-ae2c-45ff-82cd-e29d034f9685_1762096434195.png"'
)
WHERE user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'
AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo')
RETURNING id, display_name, content->>'photo_url' as restored_url;
*/
