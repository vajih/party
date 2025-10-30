-- ============================================
-- CLEAN ALL DATA (keeps table structure)
-- WARNING: This will delete ALL data from your party database
-- Tables and schema remain intact
-- ============================================

-- Delete all data in order (respects foreign key constraints)
DELETE FROM votes;
DELETE FROM submissions;
DELETE FROM party_profiles;
DELETE FROM games;
DELETE FROM party_hosts;
DELETE FROM parties;

-- Verification query - should show 0 for all tables
SELECT 
  'parties' as table_name, COUNT(*) as record_count FROM parties
UNION ALL
SELECT 'party_hosts', COUNT(*) FROM party_hosts
UNION ALL
SELECT 'games', COUNT(*) FROM games
UNION ALL
SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL
SELECT 'votes', COUNT(*) FROM votes
UNION ALL
SELECT 'party_profiles', COUNT(*) FROM party_profiles;
