-- Migration 007: Drop Restrictive Constraint
-- DESCRIPTION: Remove the constraint that forces 'votes.amount' to be exactly 2.
-- This allows users to add more stakes (Boost Vote).

ALTER TABLE votes DROP CONSTRAINT votes_amount_check;

-- Optional: Add a new constraint ensuring amount matches increments of 2 (if desired),
-- or just ensure it is positive.
ALTER TABLE votes ADD CONSTRAINT votes_amount_check CHECK (amount > 0);
