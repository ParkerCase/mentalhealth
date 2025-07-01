-- Create RPC function to get groups with extracted coordinates from PostGIS geometry
-- Run this in your Supabase SQL editor

CREATE OR REPLACE FUNCTION get_groups_with_coordinates()
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
  lng DOUBLE PRECISION
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
    ST_X(ST_AsText(g.geo_location)) as lng
  FROM groups g
  WHERE g.geo_location IS NOT NULL;
$$; 