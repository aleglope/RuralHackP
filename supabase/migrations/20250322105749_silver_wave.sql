/*
  # Update RLS policies for travel results tables

  1. Changes
    - Update RLS policies to properly allow public inserts
    - Add select policies for public access
    - Add policies for travel segments

  2. Security
    - Enable RLS on both tables
    - Allow public insert and select access
*/

-- Create travel_results table
CREATE TABLE IF NOT EXISTS travel_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_type text NOT NULL,
  hotel_nights integer,
  comments text,
  carbon_footprint numeric NOT NULL,
  trees_needed numeric NOT NULL,
  total_distance numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create travel_segments table
CREATE TABLE IF NOT EXISTS travel_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_result_id uuid REFERENCES travel_results(id) ON DELETE CASCADE,
  vehicle_type text NOT NULL,
  fuel_type text,
  passengers integer,
  van_size text,
  truck_size text,
  carbon_compensated boolean DEFAULT false,
  date date,
  distance numeric,
  origin text,
  destination text,
  return_trip boolean DEFAULT false,
  frequency integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE travel_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_segments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert travel results" ON travel_results;
DROP POLICY IF EXISTS "Anyone can insert travel segments" ON travel_segments;

-- Create updated policies for travel_results
CREATE POLICY "Enable read access for all users" ON travel_results
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable insert access for all users" ON travel_results
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Create updated policies for travel_segments
CREATE POLICY "Enable read access for all users" ON travel_segments
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable insert access for all users" ON travel_segments
    FOR INSERT
    TO public
    WITH CHECK (true);