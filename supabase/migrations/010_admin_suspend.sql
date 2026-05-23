-- ============================================
-- Migration 010: Admin Suspend User
-- ============================================

CREATE OR REPLACE FUNCTION admin_suspend_user(target_user_id UUID)
RETURNS void AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- check caller role
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can suspend users.';
  END IF;
  
  -- update
  UPDATE profiles SET is_approved = false, updated_at = NOW() WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
