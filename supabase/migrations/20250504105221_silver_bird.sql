/*
  # Initial Schema Setup for Event Management System

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `date` (date)
      - `location` (text)
      - `capacity` (integer)
      - `registration_count` (integer)
      - `image_url` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid, foreign key to auth.users)

    - `registrations`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `phone` (text)
      - `location` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    - Add policies for public access to events
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  location text NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  registration_count integer NOT NULL DEFAULT 0,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  location text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Policies for events
CREATE POLICY "Events are viewable by everyone" 
ON events FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Events can be created by authenticated users" 
ON events FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Events can be updated by owners" 
ON events FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Events can be deleted by owners" 
ON events FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Policies for registrations
CREATE POLICY "Registrations are viewable by event owners" 
ON registrations FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = registrations.event_id 
    AND events.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create registrations" 
ON registrations FOR INSERT 
TO public 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);
CREATE INDEX IF NOT EXISTS registrations_event_id_idx ON registrations(event_id);
CREATE INDEX IF NOT EXISTS events_date_idx ON events(date);