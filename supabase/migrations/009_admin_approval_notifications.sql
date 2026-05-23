-- ============================================
-- Migration 009: Admin Notifications on New User
-- ============================================

CREATE OR REPLACE FUNCTION notify_admins_of_pending_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_approved = false THEN
    -- Insert a notification for every admin
    INSERT INTO notifications (user_id, title, message)
    SELECT id, 'New User Approval Required', 'A new user (' || NEW.email || ') has registered as ' || NEW.role || ' and is waiting for approval.'
    FROM profiles
    WHERE role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_pending_user_created ON profiles;
CREATE TRIGGER on_pending_user_created
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION notify_admins_of_pending_user();
