-- ============================================
-- Healthcare SaaS Dashboard — Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable pg_trgm extension for GIN indexes
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- PATIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  medical_record_number TEXT NOT NULL UNIQUE,
  insurance_provider TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients (status);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients USING gin (full_name gin_trgm_ops);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies: only authenticated users can access
CREATE POLICY "Authenticated users can read patients"
  ON patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete patients"
  ON patients FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checkup', 'follow-up', 'emergency', 'consultation')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent end_time before start_time
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_date ON appointments (provider_name, appointment_date);

-- Enable Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- ============================================
-- SEED DATA (optional — for testing)
-- ============================================
INSERT INTO patients (full_name, date_of_birth, gender, email, phone, address, medical_record_number, insurance_provider, status)
VALUES
  ('Sarah Johnson', '1985-03-15', 'female', 'sarah.johnson@email.com', '5551234567', '123 Oak Street, Springfield, IL', 'MRN-001', 'BlueCross', 'active'),
  ('Michael Chen', '1972-08-22', 'male', 'michael.chen@email.com', '5559876543', '456 Maple Ave, Portland, OR', 'MRN-002', 'Aetna', 'active'),
  ('Emily Rodriguez', '1990-11-30', 'female', 'emily.rodriguez@email.com', '5555551234', '789 Pine Blvd, Austin, TX', 'MRN-003', 'UnitedHealth', 'critical'),
  ('James Williams', '1968-05-10', 'male', 'james.williams@email.com', '5554443333', '321 Elm Court, Denver, CO', 'MRN-004', NULL, 'inactive'),
  ('Aisha Patel', '1995-01-25', 'female', 'aisha.patel@email.com', '5552221111', '654 Birch Lane, Seattle, WA', 'MRN-005', 'Cigna', 'active'),
  ('Robert Kim', '1980-07-18', 'male', 'robert.kim@email.com', '5556667777', '987 Cedar Dr, Miami, FL', 'MRN-006', 'Humana', 'active'),
  ('Maria Santos', '1988-12-03', 'female', 'maria.santos@email.com', '5558889999', '159 Walnut St, Chicago, IL', 'MRN-007', 'BlueCross', 'critical')
ON CONFLICT (email) DO NOTHING;

INSERT INTO appointments (patient_id, provider_name, appointment_date, start_time, end_time, type, status, notes)
SELECT
  p.id,
  'Dr. Anderson',
  CURRENT_DATE,
  '09:00'::TIME,
  '09:30'::TIME,
  'checkup',
  'scheduled',
  'Annual physical examination'
FROM patients p WHERE p.email = 'sarah.johnson@email.com'
UNION ALL
SELECT
  p.id,
  'Dr. Wilson',
  CURRENT_DATE,
  '10:00',
  '10:45',
  'follow-up',
  'scheduled',
  'Post-surgery follow-up'
FROM patients p WHERE p.email = 'michael.chen@email.com'
UNION ALL
SELECT
  p.id,
  'Dr. Anderson',
  CURRENT_DATE,
  '11:00',
  '11:30',
  'emergency',
  'scheduled',
  'Chest pain evaluation'
FROM patients p WHERE p.email = 'emily.rodriguez@email.com'
UNION ALL
SELECT
  p.id,
  'Dr. Wilson',
  CURRENT_DATE + INTERVAL '1 day',
  '14:00',
  '14:30',
  'consultation',
  'scheduled',
  'New patient consultation'
FROM patients p WHERE p.email = 'aisha.patel@email.com'
UNION ALL
SELECT
  p.id,
  'Dr. Anderson',
  CURRENT_DATE + INTERVAL '2 days',
  '09:00',
  '09:30',
  'checkup',
  'scheduled',
  'Routine blood work review'
FROM patients p WHERE p.email = 'robert.kim@email.com';
