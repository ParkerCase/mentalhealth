-- CORRECT RLS policies for groups table
-- Requirements:
-- 1. Only logged-in (authenticated) users can view approved groups
-- 2. Only logged-in users can create groups
-- 3. Only admins can approve/manage groups

-- Enable RLS if not already enabled
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Anyone can view approved groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can view approved groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Admins can view all groups" ON groups;
DROP POLICY IF EXISTS "Admins can manage all groups" ON groups;
DROP POLICY IF EXISTS "Group leaders can update their groups" ON groups;
DROP POLICY IF EXISTS "Group leaders can delete their groups" ON groups;

-- Policy 1: Only authenticated users can view approved groups
-- (NOT anonymous users - they must be logged in)
CREATE POLICY "Authenticated users can view approved groups" ON groups
  FOR SELECT
  TO authenticated
  USING (approved = true);

-- Policy 2: Authenticated users can create groups
-- This allows logged-in users to submit group requests
CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Admins can view ALL groups (including unapproved)
-- This allows admins to see pending submissions
-- Use JWT to get email - can't query auth.users directly in RLS
CREATE POLICY "Admins can view all groups" ON groups
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN ('jongfisher70@gmail.com', 'parkere.case@gmail.com')
  );

-- Policy 4: ONLY Admins can update/approve groups
-- Regular users cannot update groups, only admins can approve them
CREATE POLICY "Admins can manage all groups" ON groups
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN ('jongfisher70@gmail.com', 'parkere.case@gmail.com')
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') IN ('jongfisher70@gmail.com', 'parkere.case@gmail.com')
  );

-- Policy 5: ONLY Admins can delete groups
CREATE POLICY "Admins can delete groups" ON groups
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN ('jongfisher70@gmail.com', 'parkere.case@gmail.com')
  );

-- Note: Group leaders cannot update/delete their own groups
-- Only admins can manage groups (approve, reject, edit, delete)
