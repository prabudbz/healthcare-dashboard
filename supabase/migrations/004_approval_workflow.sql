-- ============================================
-- Migration 004: Registration Approvals Workflow
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Add is_approved column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Update the trigger function to handle approvals and meta_data role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role TEXT;
  approved BOOLEAN;
BEGIN
  -- Default fallback
  assigned_role := 'staff';
  approved := false;

  -- If it's the designated admin email, auto-approve and make admin
  IF new.email = 'admin@meddash.com' THEN
    assigned_role := 'admin';
    approved := true;
  ELSE
    -- Check if a role was requested during signup via metadata
    IF new.raw_user_meta_data->>'role' = 'doctor' THEN
      assigned_role := 'doctor';
    ELSIF new.raw_user_meta_data->>'role' = 'staff' THEN
      assigned_role := 'staff';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, is_approved)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    assigned_role,
    approved
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Add admin RPC for approving/rejecting users
CREATE OR REPLACE FUNCTION admin_approve_user(target_user_id UUID)
RETURNS void AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- check caller role
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can approve users.';
  END IF;
  
  -- update
  UPDATE profiles SET is_approved = true, updated_at = NOW() WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION admin_reject_user(target_user_id UUID)
RETURNS void AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- check caller role
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can reject users.';
  END IF;
  
  -- We simply delete the profile so they cannot login (or stay pending forever).
  -- Note: We can't easily delete auth.users without service_role key, but deleting profile
  -- breaks the app access.
  DELETE FROM profiles WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
