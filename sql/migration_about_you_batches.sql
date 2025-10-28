-- Migration: Add batch progress tracking to About You
-- Run this in Supabase SQL Editor

-- Add batch_progress column to track completion of question batches
ALTER TABLE party_profiles 
ADD COLUMN IF NOT EXISTS batch_progress JSONB DEFAULT '{}'::jsonb;

-- Add extended_answers column to store structured answers to new questions
ALTER TABLE party_profiles
ADD COLUMN IF NOT EXISTS extended_answers JSONB DEFAULT '{}'::jsonb;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_party_profiles_batch_progress 
ON party_profiles USING gin(batch_progress);

CREATE INDEX IF NOT EXISTS idx_party_profiles_extended_answers 
ON party_profiles USING gin(extended_answers);

-- Comment explaining the structure
COMMENT ON COLUMN party_profiles.batch_progress IS 
'Tracks completion status of question batches. Format: {"batch_1": "complete", "batch_2": "in_progress", "batch_3": "not_started"}';

COMMENT ON COLUMN party_profiles.extended_answers IS 
'Stores answers to extended About You questions. Format: {"question_id": {"value": "answer", "timestamp": "2025-01-01T00:00:00Z"}}';

-- Sample query to get completion stats
-- SELECT 
--   display_name,
--   batch_progress,
--   CASE 
--     WHEN (batch_progress->>'batch_1') = 'complete' 
--      AND (batch_progress->>'batch_2') = 'complete' 
--      AND (batch_progress->>'batch_3') = 'complete' 
--     THEN 100
--     WHEN (batch_progress->>'batch_1') = 'complete' 
--      AND (batch_progress->>'batch_2') = 'complete' 
--     THEN 66
--     WHEN (batch_progress->>'batch_1') = 'complete' 
--     THEN 33
--     ELSE 0
--   END as completion_percentage
-- FROM party_profiles
-- WHERE party_id = 'your-party-id';
