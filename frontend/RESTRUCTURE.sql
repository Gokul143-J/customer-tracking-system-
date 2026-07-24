-- ============================================================
-- RESTRUCTURE: 5 Sections + Employee Management
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Replace old sections with 5 clean ones
DELETE FROM sections;
INSERT INTO sections (name, display_name, display_order, is_active, color) VALUES
  ('reception', 'Reception', 0, true, '#F59E0B'),
  ('gold', 'Gold Section', 1, true, '#D4AF37'),
  ('silver', 'Silver Section', 2, true, '#C0C0C0'),
  ('diamond', 'Diamond Section', 3, true, '#6366F1'),
  ('platinum', 'Platinum Section', 4, true, '#E5E4E2')
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name;

-- 2. Add target_section to tickets (where customer is headed)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS target_section TEXT;

-- 3. Ensure staff has assigned_section
ALTER TABLE staff ADD COLUMN IF NOT EXISTS assigned_section TEXT;

-- 4. Update existing staff assignments
UPDATE staff SET assigned_section = 'reception' WHERE role = 'admin';
UPDATE staff SET assigned_section = 'reception' WHERE username = 'employee1';

-- 5. Create section employees (one per section for demo)
INSERT INTO staff (username, password_hash, full_name, email, role, assigned_section, is_active) VALUES
  ('gold_emp', 'emp123', 'Raj Kumar', 'raj@royal.com', 'sales_executive', 'gold', true),
  ('silver_emp', 'emp123', 'Amit Patel', 'amit@royal.com', 'sales_executive', 'silver', true),
  ('diamond_emp', 'emp123', 'Vikram Singh', 'vikram@royal.com', 'sales_executive', 'diamond', true),
  ('platinum_emp', 'emp123', 'Rohan Mehta', 'rohan@royal.com', 'sales_executive', 'platinum', true)
ON CONFLICT (username) DO UPDATE SET assigned_section = EXCLUDED.assigned_section;

-- 6. Ensure section_time_logs table exists
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

CREATE POLICY "Allow all for development" ON section_time_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DONE
-- ============================================================
