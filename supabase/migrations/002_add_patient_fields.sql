-- ============================================
-- Migration 002: Add chief_complaint and assigned_doctor to patients
-- Run this in your Supabase SQL Editor
-- ============================================

-- Make medical_record_number nullable (was NOT NULL)
ALTER TABLE patients
  ALTER COLUMN medical_record_number DROP NOT NULL;

-- Add chief_complaint column (patient's initial complaint / diagnosis)
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS chief_complaint TEXT;

-- Add assigned_doctor column
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS assigned_doctor TEXT;
