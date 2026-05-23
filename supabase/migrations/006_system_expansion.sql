-- ============================================
-- Migration 006: System Expansion
-- Run this in your Supabase SQL Editor
-- ============================================

-- Add specialty to doctors
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty TEXT;

-- Add admission_type to patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS admission_type TEXT;
