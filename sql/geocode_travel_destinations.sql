-- Migration to geocode existing favorite travel destinations
-- This script helps prepare data for manual geocoding via external tools

-- First, let's see what travel destinations need geocoding
SELECT 
  pp.user_id,
  pp.display_name,
  pp.extended_answers->'fav_city_travel' as travel_city,
  pp.fav_dest_city,
  pp.fav_dest_lat,
  pp.fav_dest_lng
FROM party_profiles pp
WHERE 
  pp.extended_answers->'fav_city_travel' IS NOT NULL
  AND (pp.fav_dest_lat IS NULL OR pp.fav_dest_lng IS NULL)
ORDER BY pp.display_name;

-- To update manually after geocoding:
-- UPDATE party_profiles
-- SET 
--   fav_dest_city = 'Paris',
--   fav_dest_lat = 48.8566,
--   fav_dest_lng = 2.3522
-- WHERE user_id = 'xxx' AND party_id = 'xxx';
