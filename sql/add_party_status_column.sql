-- Add status column to parties table
ALTER TABLE parties 
ADD COLUMN IF NOT EXISTS status text 
CHECK (status IN ('active', 'cancelled', 'completed')) 
DEFAULT 'active';

-- Set all existing parties to 'active' status
UPDATE parties SET status = 'active' WHERE status IS NULL;
