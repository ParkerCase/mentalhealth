-- SQL function to update group geo_location
-- Run this in your Supabase SQL editor first, then run the populate script

CREATE OR REPLACE FUNCTION update_group_location(
  group_id UUID,
  latitude FLOAT,
  longitude FLOAT
)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE groups 
  SET geo_location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  WHERE id = group_id;
$$;
