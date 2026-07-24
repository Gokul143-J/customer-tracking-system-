-- ============================================================
-- ADD ASSIGNED_SECTION TO STAFF TABLE
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add assigned_section column to staff
ALTER TABLE staff ADD COLUMN IF NOT EXISTS assigned_section TEXT;

-- Update existing staff with their sections
UPDATE staff SET assigned_section = 'reception' WHERE username = 'admin';
UPDATE staff SET assigned_section = 'gold_bangle' WHERE username = 'employee1';
UPDATE staff SET assigned_section = 'diamond' WHERE username = 'sales1';

-- Create section_time_logs table (if not exists)
CREATE TABLE IF NOT EXISTS section_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  customer_id UUID REFERENCES customers(id),
  section TEXT NOT NULL,
  entry_time TIMESTAMPTZ DEFAULT NOW(),
  exit_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_section_time_ticket ON section_time_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_section_time_customer ON section_time_logs(customer_id);

-- Allow all access (for development)
CREATE POLICY "Allow all for development" ON section_time_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Add more employee accounts for each section (for demo)
-- ============================================================
INSERT INTO staff (username, password_hash, full_name, email, role, assigned_section, is_active) VALUES
  ('goldring', 'emp123', 'Raj Kumar', 'raj@royal.com', 'sales_executive', 'gold_ring', true),
  ('goldchain', 'emp123', 'Amit Patel', 'amit@royal.com', 'sales_executive', 'gold_chain', true),
  ('necklace', 'emp123', 'Sara Ali', 'sara@royal.com', 'sales_executive', 'necklace', true),
  ('diamond_emp', 'emp123', 'Vikram Singh', 'vikram@royal.com', 'sales_executive', 'diamond', true),
  ('silver_emp', 'emp123', 'Neha Gupta', 'neha@royal.com', 'sales_executive', 'silver', true),
  ('platinum_emp', 'emp123', 'Rohan Mehta', 'rohan@royal.com', 'sales_executive', 'platinum', true)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- DONE! Your section tracking is ready.
-- ============================================================
