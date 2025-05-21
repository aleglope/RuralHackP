/*
  # Separate travel segments into individual records

  1. Changes
    - Add new columns to travel_segments with proper defaults
    - Drop travel_results table
    - Update RLS policies
    - Add index for better performance

  2. Security
    - Maintain RLS policies for travel_segments
    - Update policies to check event_id directly
*/

-- First add nullable columns
ALTER TABLE travel_segments
  ADD COLUMN user_type text,
  ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  ADD COLUMN comments text,
  ADD COLUMN carbon_footprint numeric DEFAULT 0,
  ADD COLUMN hotel_nights integer DEFAULT 0;

-- Copy data from travel_results to travel_segments
DO $$
BEGIN
  UPDATE travel_segments ts
  SET user_type = tr.user_type,
      event_id = tr.event_id,
      comments = tr.comments,
      carbon_footprint = tr.carbon_footprint
  FROM travel_results tr
  WHERE ts.travel_result_id = tr.id;
END $$;

-- Now make required columns NOT NULL
ALTER TABLE travel_segments
  ALTER COLUMN user_type SET NOT NULL,
  ALTER COLUMN event_id SET NOT NULL;

-- Drop the travel_results table and its foreign key
ALTER TABLE travel_segments DROP CONSTRAINT IF EXISTS travel_segments_travel_result_id_fkey;
ALTER TABLE travel_segments DROP COLUMN travel_result_id;
DROP TABLE travel_results;

-- Update RLS policies
DROP POLICY IF EXISTS "Enable insert access for all users" ON travel_segments;
DROP POLICY IF EXISTS "Enable read access for all users" ON travel_segments;

CREATE POLICY "Allow insert for active events"
  ON travel_segments
  FOR INSERT
  TO public
  WITH CHECK (
    event_id IN (SELECT id FROM events WHERE is_active = true)
  );

CREATE POLICY "Allow read access for active events"
  ON travel_segments
  FOR SELECT
  TO public
  USING (
    event_id IN (SELECT id FROM events WHERE is_active = true)
  );

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS travel_segments_event_id_idx ON travel_segments(event_id);