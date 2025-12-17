-- Create RPC function to find groups within a certain distance of coordinates
-- Run this in your Supabase SQL editor

CREATE OR REPLACE FUNCTION get_groups_nearby(
  search_lat DOUBLE PRECISION,
  search_lng DOUBLE PRECISION,
  radius_miles DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  logo_url TEXT,
  approved BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_miles DOUBLE PRECISION
)
LANGUAGE sql
AS $$
  SELECT 
    g.id,
    g.name,
    g.description,
    g.address,
    g.city,
    g.state,
    g.zip,
    g.website,
    g.email,
    g.phone,
    g.logo_url,
    g.approved,
    g.created_at,
    g.updated_at,
    ST_Y(ST_AsText(g.geo_location)) as lat,
    ST_X(ST_AsText(g.geo_location)) as lng,
    -- Calculate distance in miles using Haversine formula via PostGIS
    (ST_Distance(
      g.geo_location::geography,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
    ) / 1609.34) as distance_miles
  FROM groups g
  WHERE g.geo_location IS NOT NULL
    AND g.approved = true
    AND ST_DWithin(
      g.geo_location::geography,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
      radius_miles * 1609.34 -- Convert miles to meters
    )
  ORDER BY distance_miles ASC;
$$;

