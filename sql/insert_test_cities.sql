-- Simple test data for birth cities map
-- This creates test entries for the FriendsGiving2025 party
-- Run this in your Supabase SQL Editor

-- Clean up any existing test data first (optional)
-- DELETE FROM party_profiles WHERE party_id = '55d89369-7e85-4b8b-99b6-213d4d8ed489';

-- Insert test birth cities with the current user's ID (you'll need to get this)
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from Supabase

-- To find your user ID, run this first:
-- SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Example data with various cities
-- Note: Using gen_random_uuid() for user_id to create unique test entries
-- In production, these should be real user IDs

DO $$
DECLARE
  v_party_id uuid := '55d89369-7e85-4b8b-99b6-213d4d8ed489';
BEGIN
  -- Tokyo, Japan (3 people)
  INSERT INTO party_profiles (party_id, user_id, display_name, birth_city, birth_lat, birth_lng)
  VALUES 
    (v_party_id, gen_random_uuid(), 'Yuki Tanaka', 'Tokyo', 35.6762, 139.6503),
    (v_party_id, gen_random_uuid(), 'Akira Sato', 'Tokyo', 35.6762, 139.6503),
    (v_party_id, gen_random_uuid(), 'Hana Yamamoto', 'Tokyo', 35.6762, 139.6503);
  
  -- New York, USA (4 people)
  INSERT INTO party_profiles (party_id, user_id, display_name, birth_city, birth_lat, birth_lng)
  VALUES 
    (v_party_id, gen_random_uuid(), 'John Smith', 'New York', 40.7128, -74.0060),
    (v_party_id, gen_random_uuid(), 'Emily Johnson', 'New York', 40.7128, -74.0060),
    (v_party_id, gen_random_uuid(), 'Michael Davis', 'New York', 40.7128, -74.0060),
    (v_party_id, gen_random_uuid(), 'Lisa Anderson', 'New York', 40.7128, -74.0060);
  
  -- London, UK (2 people)
  INSERT INTO party_profiles (party_id, user_id, display_name, birth_city, birth_lat, birth_lng)
  VALUES 
    (v_party_id, gen_random_uuid(), 'Emma Wilson', 'London', 51.5074, -0.1278),
    (v_party_id, gen_random_uuid(), 'Oliver Taylor', 'London', 51.5074, -0.1278);
  
  -- Single entries from various cities
  INSERT INTO party_profiles (party_id, user_id, display_name, birth_city, birth_lat, birth_lng)
  VALUES 
    (v_party_id, gen_random_uuid(), 'Maria Silva', 'São Paulo', -23.5505, -46.6333),
    (v_party_id, gen_random_uuid(), 'Jack Brown', 'Sydney', -33.8688, 151.2093),
    (v_party_id, gen_random_uuid(), 'Ahmed Hassan', 'Dubai', 25.2048, 55.2708),
    (v_party_id, gen_random_uuid(), 'Sophie Dubois', 'Paris', 48.8566, 2.3522),
    (v_party_id, gen_random_uuid(), 'Sarah Chen', 'Toronto', 43.6532, -79.3832),
    (v_party_id, gen_random_uuid(), 'Priya Sharma', 'Mumbai', 19.0760, 72.8777),
    (v_party_id, gen_random_uuid(), 'Hans Mueller', 'Berlin', 52.5200, 13.4050),
    (v_party_id, gen_random_uuid(), 'Carlos Rodriguez', 'Mexico City', 19.4326, -99.1332),
    (v_party_id, gen_random_uuid(), 'Min-jun Kim', 'Seoul', 37.5665, 126.9780),
    (v_party_id, gen_random_uuid(), 'Themba Nkosi', 'Cape Town', -33.9249, 18.4241),
    (v_party_id, gen_random_uuid(), 'Wei Zhang', 'Singapore', 1.3521, 103.8198);
END $$;

-- Verify the aggregated data (this is what the map will show)
SELECT 
  birth_city,
  COUNT(*) as guest_count,
  birth_lat,
  birth_lng
FROM party_profiles
WHERE party_id = '55d89369-7e85-4b8b-99b6-213d4d8ed489'
  AND birth_lat IS NOT NULL 
  AND birth_lng IS NOT NULL
GROUP BY birth_city, birth_lat, birth_lng
ORDER BY guest_count DESC, birth_city;

-- Expected results:
-- New York: 4 guests (largest circle)
-- Tokyo: 3 guests (medium-large circle)
-- London: 2 guests (medium circle)
-- All others: 1 guest each (small circles)
