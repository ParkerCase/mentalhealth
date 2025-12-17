-- Fix RLS policies for groups table
-- This allows authenticated users to create groups and view approved groups

-- Enable RLS if not already enabled
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view approved groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group leaders can update their groups" ON groups;
DROP POLICY IF EXISTS "Group leaders can delete their groups" ON groups;

-- Policy 1: Anyone (including anonymous) can view approved groups
CREATE POLICY "Anyone can view approved groups" ON groups
  FOR SELECT
  USING (approved = true);

-- Policy 2: Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Group leaders can update their own groups
-- This checks if the user is a leader of the group
CREATE POLICY "Group leaders can update their groups" ON groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_leaders
      WHERE group_leaders.group_id = groups.id
      AND group_leaders.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_leaders
      WHERE group_leaders.group_id = groups.id
      AND group_leaders.user_id = auth.uid()
    )
  );

-- Policy 4: Group leaders can delete their own groups
CREATE POLICY "Group leaders can delete their groups" ON groups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_leaders
      WHERE group_leaders.group_id = groups.id
      AND group_leaders.user_id = auth.uid()
    )
  );

-- Policy 5: Admins can do everything (optional - if you have an admin role)
-- Uncomment if you have an admin role check
-- CREATE POLICY "Admins can manage all groups" ON groups
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--       AND profiles.role = 'admin'
--     )
--   );

-- Note: Users can always view their own groups (even if not approved)
-- through the group_leaders relationship

