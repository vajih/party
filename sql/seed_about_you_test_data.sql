-- Test data for About You report testing
-- Party: friendsgiving2025-1ty7
-- Creates 8 diverse test profiles with varying completion levels

-- First, get the party_id for friendsgiving2025-1ty7
DO $$
DECLARE
  test_party_id uuid;
BEGIN
  SELECT id INTO test_party_id FROM parties WHERE slug = 'friendsgiving2025-1ty7';
  
  IF test_party_id IS NULL THEN
    RAISE EXCEPTION 'Party friendsgiving2025-1ty7 not found. Please check the party slug.';
  END IF;

  -- Profile 1: Sarah - Completed all batches
  INSERT INTO party_profiles (party_id, user_id, display_name, batch_progress, extended_answers)
  VALUES (
    test_party_id,
    gen_random_uuid(),
    'Sarah Ahmed',
    '{"batch_1": "complete", "batch_2": "complete", "batch_3": "complete"}'::jsonb,
    '{
      "birth_city": "Karachi",
      "food_pulao_biryani": {"selected": "B"},
      "food_nihari_haleem": {"selected": "A"},
      "food_mango_supremacy": "chaunsa",
      "food_comfort": "daal_chawal",
      "food_houston_halal": "himalaya",
      "food_midnight_snack": "chai_biscuits",
      "drink_chai_coffee": {"selected": "A"},
      "zodiac_sign": "leo",
      "remedy_desi_mom": "haldi_doodh",
      "smuggled_pakistan": "achar",
      "auntie_analyze": "outfits",
      "desi_dad_line": "lights_off",
      "relative_weight_comment": "mashallah",
      "mehndi_drama": "matching_outfits",
      "fav_city_travel": "Istanbul",
      "tsa_luggage": "tea_bags",
      "reunion_brag": "five_mins",
      "couple_photo_prep": "filter_smooth",
      "culture_marriage_love_arranged": {"selected": "A"}
    }'::jsonb
  )
  ON CONFLICT (party_id, user_id) DO NOTHING;

  -- Profile 2: Ali - Completed all batches
  INSERT INTO party_profiles (party_id, user_id, display_name, batch_progress, extended_answers)
  VALUES (
    test_party_id,
    gen_random_uuid(),
    'Ali Khan',
    '{"batch_1": "complete", "batch_2": "complete", "batch_3": "complete"}'::jsonb,
    '{
      "birth_city": "Lahore",
      "food_pulao_biryani": {"selected": "B"},
      "food_nihari_haleem": {"selected": "B"},
      "food_mango_supremacy": "anwar_ratol",
      "food_comfort": "biryani",
      "food_houston_halal": "bismillah",
      "food_midnight_snack": "bun_kebab",
      "drink_chai_coffee": {"selected": "B"},
      "zodiac_sign": "scorpio",
      "remedy_desi_mom": "vicks_steam",
      "smuggled_pakistan": "desi_joray",
      "auntie_analyze": "weight",
      "desi_dad_line": "money_trees",
      "relative_weight_comment": "gym_kab",
      "mehndi_drama": "dj_volume",
      "fav_city_travel": "Barcelona",
      "tsa_luggage": "spice_packets",
      "reunion_brag": "on_road",
      "couple_photo_prep": "check_partner",
      "culture_marriage_love_arranged": {"selected": "B"}
    }'::jsonb
  )
  ON CONFLICT (party_id, user_id) DO NOTHING;

  -- Profile 3: Zainab - Completed all batches (likes BOTH for some)
  INSERT INTO party_profiles (party_id, user_id, display_name, batch_progress, extended_answers)
  VALUES (
    test_party_id,
    gen_random_uuid(),
    'Zainab Malik',
    '{"batch_1": "complete", "batch_2": "complete", "batch_3": "complete"}'::jsonb,
    '{
      "birth_city": "Houston",
      "food_pulao_biryani": {"selected": "A", "modifiers": ["Both"]},
      "food_nihari_haleem": {"selected": "A"},
      "food_mango_supremacy": "sindhri",
      "food_comfort": "aloo_paratha",
      "food_houston_halal": "agas",
      "food_midnight_snack": "pakora",
      "drink_chai_coffee": {"selected": "A", "modifiers": ["Both"]},
      "zodiac_sign": "gemini",
      "remedy_desi_mom": "ajwain",
      "smuggled_pakistan": "nimko_snacks",
      "auntie_analyze": "jewelry",
      "desi_dad_line": "ask_mother",
      "relative_weight_comment": "healthy_lag_rahe",
      "mehndi_drama": "stage_photos",
      "fav_city_travel": "Dubai",
      "tsa_luggage": "henna",
      "reunion_brag": "send_address",
      "couple_photo_prep": "caption_consult",
      "culture_marriage_love_arranged": {"selected": "A", "modifiers": ["Both"]}
    }'::jsonb
  )
  ON CONFLICT (party_id, user_id) DO NOTHING;

  -- Profile 4: Hassan - Completed batches 1 & 2 only
  INSERT INTO party_profiles (party_id, user_id, display_name, batch_progress, extended_answers)
  VALUES (
    test_party_id,
    gen_random_uuid(),
    'Hassan Raza',
    '{"batch_1": "complete", "batch_2": "complete", "batch_3": "not_started"}'::jsonb,
    '{
      "birth_city": "Islamabad",
      "food_pulao_biryani": {"selected": "B"},
      "food_nihari_haleem": {"selected": "A", "modifiers": ["Both"]},
      "food_mango_supremacy": "langra",
      "food_comfort": "nihari_paratha",
      "food_houston_halal": "lasbela",
      "food_midnight_snack": "leftover_biryani",
      "drink_chai_coffee": {"selected": "B"},
      "zodiac_sign": "aries",
      "remedy_desi_mom": "adrak_honey",
      "smuggled_pakistan": "mithai",
      "auntie_analyze": "who_brought_what",
      "desi_dad_line": "back_in_my_day",
      "relative_weight_comment": "diet_karo",
      "mehndi_drama": "who_performs_first"
    }'::jsonb
  )
  ON CONFLICT (party_id, user_id) DO NOTHING;

  -- Profile 5: Fatima - Completed batch 1 only
  INSERT INTO party_profiles (party_id, user_id, display_name, batch_progress, extended_answers)
  VALUES (
    test_party_id,
    gen_random_uuid(),
    'Fatima Siddiqui',
    '{"batch_1": "complete", "batch_2": "not_started", "batch_3": "not_started"}'::jsonb,
    '{
      "birth_city": "Faisalabad",
      "food_pulao_biryani": {"selected": "A"},
      "food_nihari_haleem": {"selected": "B"},
      "food_mango_supremacy": "whatever_ripe",
      "food_comfort": "halwa_puri",
      "food_houston_halal": "tempura",
      "food_midnight_snack": "fry_unda_paratha",
      "drink_chai_coffee": {"selected": "A"}
    }'::jsonb
  )
  ON CONFLICT (party_id, user_id) DO NOTHING;

  -- Profile 6: Usman - Completed all batches
  INSERT INTO party_profiles (party_id, user_id, display_name, batch_progress, extended_answers)
  VALUES (
    test_party_id,
    gen_random_uuid(),
    'Usman Tariq',
    '{"batch_1": "complete", "batch_2": "complete", "batch_3": "complete"}'::jsonb,
    '{
      "birth_city": "Chicago",
      "food_pulao_biryani": {"selected": "B"},
      "food_nihari_haleem": {"selected": "A"},
      "food_mango_supremacy": "chaunsa",
      "food_comfort": "aloo_gosht",
      "food_houston_halal": "agas",
      "food_midnight_snack": "bun_kebab",
      "drink_chai_coffee": {"selected": "B"},
      "zodiac_sign": "sagittarius",
      "remedy_desi_mom": "johar_joshanda",
      "smuggled_pakistan": "seeds",
      "auntie_analyze": "home_decor",
      "desi_dad_line": "petrol",
      "relative_weight_comment": "kaam_mat_karo",
      "mehndi_drama": "stage_lineup",
      "fav_city_travel": "London",
      "tsa_luggage": "achar",
      "reunion_brag": "leaving_now",
      "couple_photo_prep": "crop_someone",
      "culture_marriage_love_arranged": {"selected": "A"}
    }'::jsonb
  )
  ON CONFLICT (party_id, user_id) DO NOTHING;

  -- Profile 7: Ayesha - Just started (batch 1 only)
  INSERT INTO party_profiles (party_id, user_id, display_name, batch_progress, extended_answers)
  VALUES (
    test_party_id,
    gen_random_uuid(),
    'Ayesha Patel',
    '{"batch_1": "complete", "batch_2": "not_started", "batch_3": "not_started"}'::jsonb,
    '{
      "birth_city": "New York",
      "food_pulao_biryani": {"selected": "B"},
      "food_nihari_haleem": {"selected": "B"},
      "food_mango_supremacy": "alphonso",
      "food_comfort": "mcdonalds",
      "food_houston_halal": "himalaya",
      "food_midnight_snack": "chai_biscuits",
      "drink_chai_coffee": {"selected": "A"}
    }'::jsonb
  )
  ON CONFLICT (party_id, user_id) DO NOTHING;

  -- Profile 8: Bilal - Completed all batches
  INSERT INTO party_profiles (party_id, user_id, display_name, batch_progress, extended_answers)
  VALUES (
    test_party_id,
    gen_random_uuid(),
    'Bilal Sheikh',
    '{"batch_1": "complete", "batch_2": "complete", "batch_3": "complete"}'::jsonb,
    '{
      "birth_city": "Multan",
      "food_pulao_biryani": {"selected": "A"},
      "food_nihari_haleem": {"selected": "A"},
      "food_mango_supremacy": "sindhri",
      "food_comfort": "daal_chawal",
      "food_houston_halal": "bismillah",
      "food_midnight_snack": "pakora",
      "drink_chai_coffee": {"selected": "A"},
      "zodiac_sign": "virgo",
      "remedy_desi_mom": "haldi_doodh",
      "smuggled_pakistan": "achar",
      "auntie_analyze": "outfits",
      "desi_dad_line": "lights_off",
      "relative_weight_comment": "mashallah",
      "mehndi_drama": "matching_outfits",
      "fav_city_travel": "Paris",
      "tsa_luggage": "supari",
      "reunion_brag": "five_mins",
      "couple_photo_prep": "hide_ring",
      "culture_marriage_love_arranged": {"selected": "B"}
    }'::jsonb
  )
  ON CONFLICT (party_id, user_id) DO NOTHING;

  RAISE NOTICE 'Successfully created 8 test profiles for party: friendsgiving2025-1ty7';
  RAISE NOTICE '- 5 profiles completed all 3 batches';
  RAISE NOTICE '- 1 profile completed 2 batches';
  RAISE NOTICE '- 2 profiles completed only 1 batch';
END $$;

-- Verification query
SELECT 
  'Verification Results' as report,
  COUNT(*) as total_profiles,
  SUM(CASE WHEN batch_progress->>'batch_1' = 'complete' 
           AND batch_progress->>'batch_2' = 'complete' 
           AND batch_progress->>'batch_3' = 'complete' 
      THEN 1 ELSE 0 END) as fully_complete,
  SUM(CASE WHEN batch_progress->>'batch_1' = 'complete' 
           AND batch_progress->>'batch_2' = 'complete' 
           AND batch_progress->>'batch_3' != 'complete' 
      THEN 1 ELSE 0 END) as partial_2_batches,
  SUM(CASE WHEN batch_progress->>'batch_1' = 'complete' 
           AND batch_progress->>'batch_2' != 'complete' 
      THEN 1 ELSE 0 END) as partial_1_batch
FROM party_profiles
WHERE party_id = (SELECT id FROM parties WHERE slug = 'friendsgiving2025-1ty7');
