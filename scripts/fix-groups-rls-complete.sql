-- Complete RLS policy fix for groups table
-- This ensures authenticated users can create groups and admins can see all groups

-- Enable RLS if not already enabled
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view approved groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group leaders can update their groups" ON groups;
DROP POLICY IF EXISTS "Group leaders can delete their groups" ON groups;
DROP POLICY IF EXISTS "Admins can view all groups" ON groups;
DROP POLICY IF EXISTS "Admins can manage all groups" ON groups;

-- Policy 1: Anyone (including anonymous) can view approved groups
CREATE POLICY "Anyone can view approved groups" ON groups
  FOR SELECT
  USING (approved = true);

-- Policy 2: Authenticated users can create groups
-- This is critical - without this, users cannot submit groups
CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Admins can view ALL groups (including unapproved)
-- This allows admins to see pending submissions
CREATE POLICY "Admins can view all groups" ON groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email IN ('jongfisher70@gmail.com', 'parkere.case@gmail.com')
    )
  );

-- Policy 4: Admins can update all groups
CREATE POLICY "Admins can manage all groups" ON groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email IN ('jongfisher70@gmail.com', 'parkere.case@gmail.com')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email IN ('jongfisher70@gmail.com', 'parkere.case@gmail.com')
    )
  );

-- Policy 5: Group leaders can update their own groups
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

-- Policy 6: Group leaders can delete their own groups
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

-- Note: The admin policies check email directly since we don't have a role column
-- If you add a role column later, update these policies to use it
