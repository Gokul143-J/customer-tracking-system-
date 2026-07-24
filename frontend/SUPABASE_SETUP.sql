-- ============================================================
-- ROYAL JEWELLERS CRM - COMPLETE DATABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── STAFF TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'receptionist', 'section_manager')),
  assigned_section TEXT CHECK (assigned_section IN ('reception', 'gold', 'silver', 'diamond', 'platinum')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_username ON staff(username);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_section ON staff(assigned_section);

-- ─── CUSTOMERS TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
  phone TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', '')),
  age INTEGER CHECK (age IS NULL OR (age >= 1 AND age <= 120)),
  city TEXT CHECK (char_length(city) <= 50),
  remarks TEXT CHECK (char_length(remarks) <= 200),
  visit_count INTEGER DEFAULT 1 CHECK (visit_count >= 0),
  first_visit TIMESTAMPTZ DEFAULT NOW(),
  last_visit TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);

-- ─── SECTIONS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('reception', 'gold', 'silver', 'diamond', 'platinum')),
  display_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#D4AF37',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TICKETS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  store_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'CLOSED', 'CANCELLED')),
  target_section TEXT CHECK (target_section IN ('gold', 'silver', 'diamond', 'platinum')),
  current_section TEXT NOT NULL DEFAULT 'reception',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_tickets_section ON tickets(target_section);
CREATE INDEX idx_tickets_current ON tickets(current_section);
CREATE INDEX idx_tickets_number ON tickets(ticket_number);

-- ─── MOVEMENTS TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  from_section TEXT NOT NULL,
  to_section TEXT NOT NULL,
  assigned_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  reason TEXT,
  time_spent_seconds INTEGER DEFAULT 0 CHECK (time_spent_seconds >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movements_ticket ON movements(ticket_id);
CREATE INDEX idx_movements_customer ON movements(customer_id);

-- ─── SECTION TIME LOGS TABLE ─────────────────────────
CREATE TABLE IF NOT EXISTS section_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  entry_time TIMESTAMPTZ DEFAULT NOW(),
  exit_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0 CHECK (duration_seconds >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_section_time_ticket ON section_time_logs(ticket_id);
CREATE INDEX idx_section_time_customer ON section_time_logs(customer_id);
CREATE INDEX idx_section_time_section ON section_time_logs(section);

-- ─── SALES TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  salesperson_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  store_id TEXT,
  products JSONB DEFAULT '[]',
  total_weight NUMERIC DEFAULT 0 CHECK (total_weight >= 0),
  making_charges NUMERIC DEFAULT 0 CHECK (making_charges >= 0),
  stone_weight NUMERIC DEFAULT 0 CHECK (stone_weight >= 0),
  gst_amount NUMERIC DEFAULT 0 CHECK (gst_amount >= 0),
  discount NUMERIC DEFAULT 0 CHECK (discount >= 0),
  final_amount NUMERIC DEFAULT 0 CHECK (final_amount > 0),
  invoice_number TEXT UNIQUE,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'card', 'emi')),
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_ticket ON sales(ticket_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_invoice ON sales(invoice_number);

-- ─── INVOICES TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'printed', 'sent', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_sale ON invoices(sale_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- ─── AUDIT LOGS TABLE ────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ─── SEED DATA: SECTIONS ─────────────────────────────
INSERT INTO sections (name, display_name, display_order, color) VALUES
  ('reception', 'Reception', 0, '#F59E0B'),
  ('gold', 'Gold Section', 1, '#D4AF37'),
  ('silver', 'Silver Section', 2, '#C0C0C0'),
  ('diamond', 'Diamond Section', 3, '#6366F1'),
  ('platinum', 'Platinum Section', 4, '#E5E4E2')
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name;

-- ── SEED DATA: STAFF ACCOUNTS ──────────────────────
INSERT INTO staff (username, password_hash, full_name, email, role, assigned_section, is_active) VALUES
  ('admin', 'admin123', 'System Admin', 'admin@royal.com', 'admin', 'reception', true),
  ('reception1', 'emp123', 'Priya Receptionist', 'reception@royal.com', 'receptionist', 'reception', true),
  ('gold_mgr', 'emp123', 'Raj Kumar', 'raj@royal.com', 'section_manager', 'gold', true),
  ('silver_mgr', 'emp123', 'Amit Patel', 'amit@royal.com', 'section_manager', 'silver', true),
  ('diamond_mgr', 'emp123', 'Vikram Singh', 'vikram@royal.com', 'section_manager', 'diamond', true),
  ('platinum_mgr', 'emp123', 'Rohan Mehta', 'rohan@royal.com', 'section_manager', 'platinum', true)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  assigned_section = EXCLUDED.assigned_section,
  is_active = EXCLUDED.is_active;

-- ─── ROW LEVEL SECURITY (RLS) ───────────────────────
-- Enable RLS on all tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Development policies (allow all access)
-- WARNING: For production, replace with proper role-based policies
CREATE POLICY "Allow all for development" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON section_time_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ─── FUNCTIONS & TRIGGERS ────────────────────────────

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment visit_count on customer lookup
CREATE OR REPLACE FUNCTION increment_visit_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_visit > OLD.last_visit THEN
    NEW.visit_count = OLD.visit_count + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_increment_visits BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION increment_visit_count();

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify tables created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Verify staff accounts
SELECT username, role, assigned_section, is_active FROM staff ORDER BY username;

-- Verify sections
SELECT name, display_name FROM sections ORDER BY display_order;

-- ============================================================
-- SETUP COMPLETE
-- ============================================================
