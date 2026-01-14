-- Non-destructive RLS policy fix for groups table
-- This only ADDS missing policies without dropping existing ones
-- Safe to run multiple times

-- Enable RLS if not already enabled
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view approved groups (only create if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'groups' 
    AND policyname = 'Anyone can view approved groups'
  ) THEN
    CREATE POLICY "Anyone can view approved groups" ON groups
      FOR SELECT
      USING (approved = true);
  END IF;
END $$;

-- Policy 2: Authenticated users can create groups (CRITICAL - fixes INSERT errors)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'groups' 
    AND policyname = 'Authenticated users can create groups'
  ) THEN
    CREATE POLICY "Authenticated users can create groups" ON groups
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Policy 3: Admins can view ALL groups (including unapproved)
-- Email is stored in auth.users, not profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'groups' 
    AND policyname = 'Admins can view all groups'
  ) THEN
    CREATE POLICY "Admins can view all groups" ON groups
      FOR SELECT
      TO authenticated
      USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('jongfisher70@gmail.com', 'parkere.case@gmail.com')
      );
  END IF;
END $$;

-- Policy 4: Admins can manage all groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'groups' 
    AND policyname = 'Admins can manage all groups'
  ) THEN
    CREATE POLICY "Admins can manage all groups" ON groups
      FOR ALL
      TO authenticated
      USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('jongfisher70@gmail.com', 'parkere.case@gmail.com')
      )
      WITH CHECK (
        (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('jongfisher70@gmail.com', 'parkere.case@gmail.com')
      );
  END IF;
END $$;

-- Policy 5: Group leaders can update their own groups (only if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'groups' 
    AND policyname = 'Group leaders can update their groups'
  ) THEN
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
  END IF;
END $$;

-- Policy 6: Group leaders can delete their own groups (only if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'groups' 
    AND policyname = 'Group leaders can delete their groups'
  ) THEN
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
  END IF;
END $$;

-- Note: This script is safe to run multiple times
-- It only creates policies that don't already exist
