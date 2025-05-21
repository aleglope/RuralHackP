/*
  # Remove event_name from travel_results

  1. Changes
    - Drop event_name column from travel_results table since we now use event_id
*/

-- Drop the event_name column since we now use event_id
ALTER TABLE travel_results 
  DROP COLUMN event_name;