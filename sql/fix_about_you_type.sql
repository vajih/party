-- Fix the About You game type
UPDATE games
SET type = 'about_you'
WHERE type = 'about_you_extended'
AND party_id IN (SELECT id FROM parties WHERE slug = 'friendsgiving2025-1ty7');

-- Verify the update
SELECT 
  g.id,
  g.type,
  g.title,
  g.status,
  p.slug as party_slug
FROM games g
JOIN parties p ON g.party_id = p.id
WHERE p.slug = 'friendsgiving2025-1ty7';
