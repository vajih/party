-- ============================================
-- Add About You game to your party
-- Replace 'YOUR_PARTY_SLUG' with your actual party slug
-- ============================================

-- Insert About You game for the party
INSERT INTO games (party_id, type, title, status, description, config)
SELECT 
  id as party_id,
  'about_you' as type,
  'About You' as title,
  'open' as status,
  'Get to know each other better with fun questions about food, culture, and personality!' as description,
  '{
    "batches": ["batch_1", "batch_2", "batch_3"],
    "allow_partial": true,
    "show_progress": true
  }'::jsonb as config
FROM parties
WHERE slug = 'friendsgiving2025-1ty7'
AND NOT EXISTS (
  SELECT 1 FROM games 
  WHERE games.party_id = parties.id 
  AND games.type = 'about_you'
);

-- Verify the game was created
SELECT 
  g.id,
  g.type,
  g.title,
  g.status,
  p.slug as party_slug,
  p.title as party_title
FROM games g
JOIN parties p ON g.party_id = p.id
WHERE g.type = 'about_you'
ORDER BY g.created_at DESC
LIMIT 5;
