-- ============================================================
-- REPLACE BABY PHOTO FOR USER 11c50310-ae2c-45ff-82cd-e29d034f9685
-- USING SUPABASE STORAGE (RECOMMENDED FOR PRODUCTION)
-- ============================================================

-- INSTRUCTIONS:
-- 1. Upload the new photo to Supabase Storage first
-- 2. Copy the new photo's public URL
-- 3. Replace 'NEW_PHOTO_URL_HERE' in STEP 2 with the actual URL
-- 4. Run the queries in order

-- ============================================================
-- STEP 1: VERIFY CURRENT PHOTO
-- ============================================================
SELECT 
    s.id as submission_id,
    s.user_id,
    s.display_name,
    s.content->>'photo_url' as current_photo_url,
    s.content->>'file_path' as current_file_path,
    s.created_at
FROM submissions s
JOIN games g ON s.game_id = g.id
WHERE s.user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'
AND g.type = 'baby_photo';

-- CURRENT VALUES (FOR REFERENCE):
-- photo_url: https://wzanrhtglteiqbnyxdwq.supabase.co/storage/v1/object/public/party-media/baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/11c50310-ae2c-45ff-82cd-e29d034f9685_1762096434195.png
-- file_path: baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/11c50310-ae2c-45ff-82cd-e29d034f9685_1762096434195.png

-- ⚠️ STOP HERE - Upload new photo to Supabase Storage first!
-- ============================================================


-- ============================================================
-- STEP 2: UPDATE TO NEW SUPABASE STORAGE URL
-- ✅ NEW PHOTO UPLOADED - READY TO UPDATE DATABASE
-- ============================================================

-- NEW VALUES:
-- photo_url: https://wzanrhtglteiqbnyxdwq.supabase.co/storage/v1/object/public/party-media/baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/11c50310-ae2c-45ff-82cd-e29d034f9685_NEW.png
-- file_path: baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/11c50310-ae2c-45ff-82cd-e29d034f9685_NEW.png

-- ⚠️ REMOVE THE /* AND */ BELOW TO RUN THIS QUERY:

/*
UPDATE submissions
SET content = jsonb_set(
    jsonb_set(
        content,
        '{photo_url}',
        '"https://wzanrhtglteiqbnyxdwq.supabase.co/storage/v1/object/public/party-media/baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/11c50310-ae2c-45ff-82cd-e29d034f9685_NEW.png"'
    ),
    '{file_path}',
    '"baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/11c50310-ae2c-45ff-82cd-e29d034f9685_NEW.png"'
)
WHERE user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'
AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo')
RETURNING 
    id,
    display_name,
    content->>'photo_url' as new_photo_url,
    content->>'file_path' as new_file_path;
*/

-- EXPECTED: Will return 1 row showing Vajih Khan with the new photo URL
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
WHERE s.user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'
AND g.type = 'baby_photo';
*/

-- EXPECTED: Should show the new Supabase Storage URL
-- ============================================================


-- ============================================================
-- ROLLBACK PLAN (if needed)
-- Restore original photo URL and file path:
-- ============================================================
/*
UPDATE submissions
SET content = jsonb_set(
    jsonb_set(
        content,
        '{photo_url}',
        '"https://wzanrhtglteiqbnyxdwq.supabase.co/storage/v1/object/public/party-media/baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/11c50310-ae2c-45ff-82cd-e29d034f9685_1762096434195.png"'
    ),
    '{file_path}',
    '"baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/11c50310-ae2c-45ff-82cd-e29d034f9685_1762096434195.png"'
)
WHERE user_id = '11c50310-ae2c-45ff-82cd-e29d034f9685'
AND game_id IN (SELECT id FROM games WHERE type = 'baby_photo')
RETURNING 
    id, 
    display_name, 
    content->>'photo_url' as restored_url,
    content->>'file_path' as restored_path;
*/


-- ============================================================
-- OPTIONAL: DELETE OLD FILE FROM STORAGE
-- After confirming new photo works, you can delete the old file
-- via Supabase Dashboard → Storage → party-media → navigate to file → Delete
-- Old file path: baby-photos/71d7db23-89d2-453c-ae81-1912148de4cf/a3478ecf-4d48-466e-a0d9-38b1100314aa/11c50310-ae2c-45ff-82cd-e29d034f9685_1762096434195.png
-- ============================================================
