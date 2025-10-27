-- Comprehensive test data for FriendsGiving2025 party
-- Creates 5 complete test users with submissions and party profiles
-- Run this in Supabase SQL Editor

-- STEP 1: First, find your party ID by running this query:
-- SELECT id, title, slug FROM parties ORDER BY created_at DESC LIMIT 5;
-- Copy the UUID and replace it in the line below

DO $$
DECLARE
  v_party_id uuid;
  v_game_id uuid;
  v_user1_id uuid := gen_random_uuid();
  v_user2_id uuid := gen_random_uuid();
  v_user3_id uuid := gen_random_uuid();
  v_user4_id uuid := gen_random_uuid();
  v_user5_id uuid := gen_random_uuid();
BEGIN
  -- Get the most recent party (or specify your party slug)
  SELECT id INTO v_party_id
  FROM parties
  WHERE slug = 'friendsgiving2025-yy7t'  -- UPDATE THIS with your party slug from URL
  LIMIT 1;
  
  IF v_party_id IS NULL THEN
    RAISE EXCEPTION 'Party not found! Check your party slug in the URL';
  END IF;
  
  RAISE NOTICE 'Using party_id: %', v_party_id;
  -- Get or create the "About You" game for this party
  SELECT id INTO v_game_id 
  FROM games 
  WHERE party_id = v_party_id 
    AND type = 'about_you' 
  LIMIT 1;

  IF v_game_id IS NULL THEN
    -- Create the About You game
    INSERT INTO games (party_id, type, title, status, description, config)
    VALUES (
      v_party_id,
      'about_you',
      'About You',
      'open',
      'Answer a few fun questions to help everyone get to know you better!',
      jsonb_build_object(
        'questions', jsonb_build_array(
          jsonb_build_object('label', 'What is a fun fact about you?'),
          jsonb_build_object('label', 'What is your favorite memory?'),
          jsonb_build_object('label', 'What are you looking forward to?')
        )
      )
    )
    RETURNING id INTO v_game_id;
    
    RAISE NOTICE 'Created new About You game with id: %', v_game_id;
  ELSE
    RAISE NOTICE 'Using existing game_id: %', v_game_id;
  END IF;

  -- ========================================
  -- USER 1: Sarah from Tokyo
  -- ========================================
  
  -- Party profile
  INSERT INTO party_profiles (party_id, user_id, display_name, birth_city, birth_lat, birth_lng)
  VALUES (v_party_id, v_user1_id, 'Sarah Chen', 'Tokyo', 35.6762, 139.6503);
  
  -- About You submission
  INSERT INTO submissions (party_id, game_id, user_id, display_name, content, moderation_status)
  VALUES (
    v_party_id,
    v_game_id,
    v_user1_id,
    'Sarah Chen',
    jsonb_build_object(
      'answers', jsonb_build_object(
        'q_0', 'I can speak 4 languages fluently!',
        'q_1', 'Watching cherry blossoms in Ueno Park with my family',
        'q_2', 'Meeting everyone at this amazing party!'
      )
    ),
    'approved'
  );

  -- ========================================
  -- USER 2: Marcus from New York
  -- ========================================
  
  INSERT INTO party_profiles (party_id, user_id, display_name, birth_city, birth_lat, birth_lng)
  VALUES (v_party_id, v_user2_id, 'Marcus Johnson', 'New York', 40.7128, -74.0060);
  
  INSERT INTO submissions (party_id, game_id, user_id, display_name, content, moderation_status)
  VALUES (
    v_party_id,
    v_game_id,
    v_user2_id,
    'Marcus Johnson',
    jsonb_build_object(
      'answers', jsonb_build_object(
        'q_0', 'I once performed stand-up comedy at The Comedy Cellar',
        'q_1', 'Getting my first job in tech and moving to the city',
        'q_2', 'Trying all the amazing food everyone is bringing!'
      )
    ),
    'approved'
  );

  -- ========================================
  -- USER 3: Priya from Mumbai
  -- ========================================
  
  INSERT INTO party_profiles (party_id, user_id, display_name, birth_city, birth_lat, birth_lng)
  VALUES (v_party_id, v_user3_id, 'Priya Sharma', 'Mumbai', 19.0760, 72.8777);
  
  INSERT INTO submissions (party_id, game_id, user_id, display_name, content, moderation_status)
  VALUES (
    v_party_id,
    v_game_id,
    v_user3_id,
    'Priya Sharma',
    jsonb_build_object(
      'answers', jsonb_build_object(
        'q_0', 'I have a black belt in Karate and teach kids on weekends',
        'q_1', 'Celebrating Diwali with thousands of people in my neighborhood',
        'q_2', 'Learning more about everyone''s cultures and backgrounds'
      )
    ),
    'approved'
  );

  -- ========================================
  -- USER 4: Emma from London
  -- ========================================
  
  INSERT INTO party_profiles (party_id, user_id, display_name, birth_city, birth_lat, birth_lng)
  VALUES (v_party_id, v_user4_id, 'Emma Wilson', 'London', 51.5074, -0.1278);
  
  INSERT INTO submissions (party_id, game_id, user_id, display_name, content, moderation_status)
  VALUES (
    v_party_id,
    v_game_id,
    v_user4_id,
    'Emma Wilson',
    jsonb_build_object(
      'answers', jsonb_build_object(
        'q_0', 'I worked as an extra in a Harry Potter movie!',
        'q_1', 'Studying abroad in Barcelona and traveling through Europe',
        'q_2', 'Hearing everyone''s stories and making new friends'
      )
    ),
    'approved'
  );

  -- ========================================
  -- USER 5: Carlos from Mexico City
  -- ========================================
  
  INSERT INTO party_profiles (party_id, user_id, display_name, birth_city, birth_lat, birth_lng)
  VALUES (v_party_id, v_user5_id, 'Carlos Rodriguez', 'Mexico City', 19.4326, -99.1332);
  
  INSERT INTO submissions (party_id, game_id, user_id, display_name, content, moderation_status)
  VALUES (
    v_party_id,
    v_game_id,
    v_user5_id,
    'Carlos Rodriguez',
    jsonb_build_object(
      'answers', jsonb_build_object(
        'q_0', 'I make the best tacos al pastor - family recipe!',
        'q_1', 'Climbing the Pyramids of Teotihuacan at sunrise',
        'q_2', 'Sharing my love for Mexican cuisine with everyone'
      )
    ),
    'approved'
  );

  -- Add a couple more people from New York (to test aggregation)
  INSERT INTO party_profiles (party_id, user_id, display_name, birth_city, birth_lat, birth_lng)
  VALUES 
    (v_party_id, gen_random_uuid(), 'Lisa Anderson', 'New York', 40.7128, -74.0060),
    (v_party_id, gen_random_uuid(), 'David Kim', 'New York', 40.7128, -74.0060);

  -- Add one more from London
  INSERT INTO party_profiles (party_id, user_id, display_name, birth_city, birth_lat, birth_lng)
  VALUES 
    (v_party_id, gen_random_uuid(), 'Oliver Taylor', 'London', 51.5074, -0.1278);

  RAISE NOTICE 'Successfully created 5 complete test users + 3 additional entries';
  RAISE NOTICE 'Total birth cities: 5 unique cities';
  RAISE NOTICE 'Distribution: New York (3), London (2), Tokyo (1), Mumbai (1), Mexico City (1)';
END $$;

-- Verify the submissions
SELECT 
  s.display_name,
  s.content->'answers'->>'q_0' as fun_fact,
  s.moderation_status,
  p.birth_city
FROM submissions s
LEFT JOIN party_profiles p ON s.user_id = p.user_id AND s.party_id = p.party_id
WHERE s.party_id IN (SELECT id FROM parties WHERE slug = 'friendsgiving2025-yy7t')
  AND s.game_id IN (SELECT id FROM games WHERE party_id IN (SELECT id FROM parties WHERE slug = 'friendsgiving2025-yy7t') AND type = 'about_you')
ORDER BY s.created_at DESC;

-- Verify the birth map data (this is what will appear on the map)
SELECT 
  birth_city,
  COUNT(*) as guest_count,
  STRING_AGG(display_name, ', ') as guests,
  birth_lat,
  birth_lng
FROM party_profiles
WHERE party_id IN (SELECT id FROM parties WHERE slug = 'friendsgiving2025-yy7t')
  AND birth_lat IS NOT NULL 
  AND birth_lng IS NOT NULL
GROUP BY birth_city, birth_lat, birth_lng
ORDER BY guest_count DESC, birth_city;

-- Expected map results:
-- New York: 3 guests (largest circle) - Marcus, Lisa, David
-- London: 2 guests (medium circle) - Emma, Oliver
-- Tokyo: 1 guest (small circle) - Sarah
-- Mumbai: 1 guest (small circle) - Priya
-- Mexico City: 1 guest (small circle) - Carlos
