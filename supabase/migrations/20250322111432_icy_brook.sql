/*
  # Remove event_name requirement from travel_results

  1. Changes
    - Make event_name column nullable in travel_results table
    - Add NOT NULL constraint to event_id column

  This migration reflects the change in our application where we now use event_id
  instead of event_name to identify the event associated with a travel result.
*/

-- Make event_name nullable since we now use event_id
ALTER TABLE travel_results 
  ALTER COLUMN event_name DROP NOT NULL;

-- Make event_id required since it's our primary way to identify the event
ALTER TABLE travel_results 
  ALTER COLUMN event_id SET NOT NULL;

-- Add an index on event_id for better query performance
CREATE INDEX IF NOT EXISTS travel_results_event_id_idx ON travel_results(event_id);