/*
  # Add events management

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL-friendly identifier
      - `name` (text) - Event name
      - `description` (text) - Event description
      - `start_date` (date) - Event start date
      - `end_date` (date) - Event end date
      - `created_at` (timestamp)
      - `created_by` (uuid) - Reference to auth.users
      - `is_active` (boolean) - Whether the event is currently active

  2. Changes
    - Add `event_id` to `travel_results` table
    - Add foreign key constraint

  3. Security
    - Enable RLS on `events` table
    - Add policies for event management
    - Update travel_results policies
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Add event_id to travel_results
ALTER TABLE travel_results 
ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies for events table
CREATE POLICY "Allow public read access to active events"
  ON events
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow authenticated users to create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow event creators to update their events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Update travel_results policies to consider events
DROP POLICY IF EXISTS "Enable insert access for all users" ON travel_results;
DROP POLICY IF EXISTS "Enable read access for all users" ON travel_results;

CREATE POLICY "Allow insert for active events"
  ON travel_results
  FOR INSERT
  TO public
  WITH CHECK (
    event_id IN (SELECT id FROM events WHERE is_active = true)
  );

CREATE POLICY "Allow read access for active events"
  ON travel_results
  FOR SELECT
  TO public
  USING (
    event_id IN (SELECT id FROM events WHERE is_active = true)
  );