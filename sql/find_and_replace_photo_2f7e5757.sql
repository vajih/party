-- ============================================================
-- FIND AND REPLACE BABY PHOTO FOR USER 2f7e5757-3e82-4ad0-9fb0-ba5d27cfe8f0
-- ============================================================

-- ============================================================
-- STEP 1: FIND THE USER'S CURRENT BABY PHOTO
-- ============================================================
SELECT 
    s.id as submission_id,
    s.user_id,
    s.display_name,
    s.content->>'photo_url' as current_photo_url,
    s.content->>'file_path' as current_file_path,
    s.content,
    s.created_at,
    g.type as game_type
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = '2f7e5757-3e82-4ad0-9fb0-ba5d27cfe8f0'
AND g.type = 'baby_photo';

-- RUN THIS FIRST - It will show you:
-- 1. Their display name
-- 2. Current photo URL
-- 3. Current file path in storage
-- 4. Full content JSON

-- ⚠️ STOP HERE - Review the results, then:
-- 1. Upload the new photo to Supabase Storage (same folder structure)
-- 2. Copy the new photo's public URL
-- 3. Continue to STEP 2 below
-- ============================================================


-- ============================================================
-- STEP 2: UPDATE TO NEW PHOTO
-- ✅ NEW PHOTO UPLOADED - READY TO UPDATE DATABASE
-- ============================================================

-- NEW PHOTO DETAILS:
-- NEW_PHOTO_URL: https://wzanrhtglteiqbnyxdwq.supabase.co/storage/v1/object/public/party-media/baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/2f7e5757-3e82-4ad0-9fb0-ba5d27cfe8f0_NEW.png
-- NEW_FILE_PATH: baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/2f7e5757-3e82-4ad0-9fb0-ba5d27cfe8f0_NEW.png

-- ⚠️ REMOVE THE /* AND */ BELOW TO RUN THIS QUERY:

/*
UPDATE submissions
SET content = jsonb_set(
    jsonb_set(
        content,
        '{photo_url}',
        '"https://wzanrhtglteiqbnyxdwq.supabase.co/storage/v1/object/public/party-media/baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/2f7e5757-3e82-4ad0-9fb0-ba5d27cfe8f0_NEW.png"'
    ),
    '{file_path}',
    '"baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/2f7e5757-3e82-4ad0-9fb0-ba5d27cfe8f0_NEW.png"'
)
WHERE user_id = '2f7e5757-3e82-4ad0-9fb0-ba5d27cfe8f0'
AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo')
RETURNING 
    id,
    display_name,
    content->>'photo_url' as new_photo_url,
    content->>'file_path' as new_file_path;
*/

-- ============================================================


-- ============================================================
-- STEP 3: VERIFY THE UPDATE
-- ============================================================
/*
SELECT 
    s.id,
    s.display_name,
    s.content->>'photo_url' as photo_url,
    s.content->>'file_path' as file_path,
    s.created_at
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = '2f7e5757-3e82-4ad0-9fb0-ba5d27cfe8f0'
AND g.type = 'baby_photo';
*/

-- ============================================================


-- ============================================================
-- ROLLBACK PLAN
-- Will be filled in after STEP 1 shows current values
-- ============================================================
/*
UPDATE submissions
SET content = jsonb_set(
    jsonb_set(
        content,
        '{photo_url}',
        '"ORIGINAL_PHOTO_URL_FROM_STEP_1"'
    ),
    '{file_path}',
    '"ORIGINAL_FILE_PATH_FROM_STEP_1"'
)
WHERE user_id = '2f7e5757-3e82-4ad0-9fb0-ba5d27cfe8f0'
AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo')
RETURNING 
    id, 
    display_name, 
    content->>'photo_url' as restored_url,
    content->>'file_path' as restored_path;
*/
