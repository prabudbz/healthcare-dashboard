-- ============================================
-- Migration 007: Fix Doctor RLS for Name Formatting
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Update RLS on patients table for Doctors
DROP POLICY IF EXISTS "Role based read patients" ON patients;
DROP POLICY IF EXISTS "Role based update patients" ON patients;

CREATE POLICY "Role based read patients"
  ON patients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role IN ('admin', 'staff') OR 
        (profiles.role = 'doctor' AND patients.assigned_doctor IN (profiles.full_name, 'Dr. ' || profiles.full_name))
      )
    )
  );

CREATE POLICY "Role based update patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role IN ('admin', 'staff') OR 
        (profiles.role = 'doctor' AND patients.assigned_doctor IN (profiles.full_name, 'Dr. ' || profiles.full_name))
      )
    )
  )
  WITH CHECK (true);


-- 2. Update RLS on appointments table for Doctors
DROP POLICY IF EXISTS "Role based read appointments" ON appointments;
DROP POLICY IF EXISTS "Role based update appointments" ON appointments;

CREATE POLICY "Role based read appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role IN ('admin', 'staff') OR 
        (profiles.role = 'doctor' AND appointments.provider_name IN (profiles.full_name, 'Dr. ' || profiles.full_name))
      )
    )
  );

CREATE POLICY "Role based update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role IN ('admin', 'staff') OR 
        (profiles.role = 'doctor' AND appointments.provider_name IN (profiles.full_name, 'Dr. ' || profiles.full_name))
      )
    )
  )
  WITH CHECK (true);
