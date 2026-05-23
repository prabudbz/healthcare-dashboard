-- ============================================
-- Migration 005: Expanded Profile Details
-- Run this in your Supabase SQL Editor
-- ============================================

-- Add phone and address columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
