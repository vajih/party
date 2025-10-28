-- Debug About You Extended Answers
-- Run this in Supabase SQL Editor to see the actual data structure

-- 1. Check if columns exist and see sample data
SELECT 
  display_name,
  batch_progress,
  extended_answers,
  created_at
FROM party_profiles
WHERE extended_answers IS NOT NULL 
  AND extended_answers != '{}'::jsonb
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check specific user's data (replace with actual party_id)
-- SELECT 
--   display_name,
--   batch_progress,
--   jsonb_pretty(extended_answers) as answers_formatted
-- FROM party_profiles
-- WHERE party_id = 'YOUR_PARTY_ID_HERE'
-- ORDER BY display_name;

-- 3. Check data types and structure of answers
-- SELECT 
--   display_name,
--   jsonb_typeof(extended_answers) as answer_type,
--   jsonb_object_keys(extended_answers) as question_ids
-- FROM party_profiles
-- WHERE extended_answers IS NOT NULL 
--   AND extended_answers != '{}'::jsonb
-- LIMIT 5;

-- 4. See a specific answer structure
-- SELECT 
--   display_name,
--   extended_answers->'food_choice' as food_answer,
--   extended_answers->'fav_sport' as sport_answer,
--   extended_answers->'birth_city' as birth_city_answer
-- FROM party_profiles
-- WHERE extended_answers IS NOT NULL
-- LIMIT 5;
