-- Test data for birth cities map
-- This script adds sample birth city data to party_profiles for testing the map visualization
-- Replace the party_id with your actual party ID

-- IMPORTANT: Update this party_id to match your test party
-- You can find your party ID in the browser URL or console logs
\set party_id '55d89369-7e85-4b8b-99b6-213d4d8ed489'

-- Note: You'll need to create test users first or use existing user IDs
-- For this example, we'll use the auth.users table to get some user IDs

-- Insert test birth cities for various locations
-- These will be upserted, so running this multiple times is safe

INSERT INTO party_profiles (party_id, user_id, display_name, birth_city, birth_lat, birth_lng, created_at)
VALUES 
  -- Islamabad, Pakistan (already exists, this will update)
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Ali Khan', 'Islamabad', 33.6938118, 73.0651511, NOW()),
  
  -- Tokyo, Japan
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Yuki Tanaka', 'Tokyo', 35.6762, 139.6503, NOW()),
  
  -- London, UK
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Emma Wilson', 'London', 51.5074, -0.1278, NOW()),
  
  -- New York, USA
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'John Smith', 'New York', 40.7128, -74.0060, NOW()),
  
  -- São Paulo, Brazil
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Maria Silva', 'São Paulo', -23.5505, -46.6333, NOW()),
  
  -- Sydney, Australia
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Jack Brown', 'Sydney', -33.8688, 151.2093, NOW()),
  
  -- Dubai, UAE
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Ahmed Hassan', 'Dubai', 25.2048, 55.2708, NOW()),
  
  -- Paris, France
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Sophie Dubois', 'Paris', 48.8566, 2.3522, NOW()),
  
  -- Toronto, Canada
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Sarah Chen', 'Toronto', 43.6532, -79.3832, NOW()),
  
  -- Mumbai, India
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Priya Sharma', 'Mumbai', 19.0760, 72.8777, NOW()),
  
  -- Berlin, Germany
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Hans Mueller', 'Berlin', 52.5200, 13.4050, NOW()),
  
  -- Mexico City, Mexico
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Carlos Rodriguez', 'Mexico City', 19.4326, -99.1332, NOW()),
  
  -- Seoul, South Korea
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Min-jun Kim', 'Seoul', 37.5665, 126.9780, NOW()),
  
  -- Cape Town, South Africa
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Themba Nkosi', 'Cape Town', -33.9249, 18.4241, NOW()),
  
  -- Singapore
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Wei Zhang', 'Singapore', 1.3521, 103.8198, NOW()),
  
  -- Add some duplicates to test aggregation (multiple people from same city)
  -- More people from Tokyo
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Akira Sato', 'Tokyo', 35.6762, 139.6503, NOW()),
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Hana Yamamoto', 'Tokyo', 35.6762, 139.6503, NOW()),
  
  -- More people from London
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Oliver Taylor', 'London', 51.5074, -0.1278, NOW()),
  
  -- More people from New York
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Emily Johnson', 'New York', 40.7128, -74.0060, NOW()),
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Michael Davis', 'New York', 40.7128, -74.0060, NOW()),
  (:'party_id', (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 'Lisa Anderson', 'New York', 40.7128, -74.0060, NOW())

ON CONFLICT (party_id, user_id) 
DO UPDATE SET
  display_name = EXCLUDED.display_name,
  birth_city = EXCLUDED.birth_city,
  birth_lat = EXCLUDED.birth_lat,
  birth_lng = EXCLUDED.birth_lng,
  created_at = EXCLUDED.created_at;

-- Verify the data
SELECT 
  birth_city,
  COUNT(*) as guest_count,
  birth_lat,
  birth_lng
FROM party_profiles
WHERE party_id = :'party_id'
  AND birth_lat IS NOT NULL 
  AND birth_lng IS NOT NULL
GROUP BY birth_city, birth_lat, birth_lng
ORDER BY guest_count DESC, birth_city;
