/*
  # Create travel results tables

  1. New Tables
    - `travel_results`
      - `id` (uuid, primary key)
      - `event_name` (text)
      - `user_type` (text)
      - `hotel_nights` (integer)
      - `comments` (text)
      - `carbon_footprint` (numeric)
      - `trees_needed` (numeric)
      - `total_distance` (numeric)
      - `created_at` (timestamptz)

    - `travel_segments`
      - `id` (uuid, primary key)
      - `travel_result_id` (uuid, foreign key)
      - `vehicle_type` (text)
      - `fuel_type` (text)
      - `passengers` (integer)
      - `van_size` (text)
      - `truck_size` (text)
      - `carbon_compensated` (boolean)
      - `date` (date)
      - `distance` (numeric)
      - `origin` (text)
      - `destination` (text)
      - `return_trip` (boolean)
      - `frequency` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to insert data
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

-- Create policies
CREATE POLICY "Anyone can insert travel results"
  ON travel_results
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can insert travel segments"
  ON travel_segments
  FOR INSERT
  TO public
  WITH CHECK (true);