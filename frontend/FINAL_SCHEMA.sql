-- ============================================================
-- ROYAL JEWELLERS CRM - FINAL DATABASE SCHEMA
-- Roles: admin, receptionist, section_manager
-- Sections: reception, gold, silver, diamond, platinum
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── STAFF ───────────────────────────────────────────
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS section_time_logs CASCADE;
DROP TABLE IF EXISTS movements CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'receptionist', 'section_manager')),
  assigned_section TEXT CHECK (assigned_section IN ('reception','gold','silver','diamond','platinum')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CUSTOMERS ───────────────────────────────────────
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT,
  age INTEGER CHECK (age >= 0 AND age <= 150),
  city TEXT,
  remarks TEXT,
  visit_count INTEGER DEFAULT 1,
  first_visit TIMESTAMPTZ DEFAULT NOW(),
  last_visit TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_customers_phone ON customers(phone);

-- ─── SECTIONS ────────────────────────────────────────
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('reception','gold','silver','diamond','platinum')),
  display_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#D4AF37',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TICKETS ─────────────────────────────────────────
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  created_by UUID REFERENCES staff(id),
  store_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','COMPLETED','CLOSED','CANCELLED')),
  target_section TEXT CHECK (target_section IN ('gold','silver','diamond','platinum')),
  current_section TEXT NOT NULL DEFAULT 'reception',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_tickets_section ON tickets(target_section);

-- ─── MOVEMENTS ───────────────────────────────────────
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  customer_id UUID REFERENCES customers(id),
  from_section TEXT NOT NULL,
  to_section TEXT NOT NULL,
  reason TEXT,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_movements_ticket ON movements(ticket_id);

-- ─── SECTION TIME LOGS ───────────────────────────────
CREATE TABLE section_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  customer_id UUID REFERENCES customers(id),
  section TEXT NOT NULL,
  entry_time TIMESTAMPTZ DEFAULT NOW(),
  exit_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_section_time_ticket ON section_time_logs(ticket_id);
CREATE INDEX idx_section_time_customer ON section_time_logs(customer_id);

-- ─── SALES ───────────────────────────────────────────
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  customer_id UUID REFERENCES customers(id),
  salesperson_id UUID REFERENCES staff(id),
  store_id TEXT,
  total_weight NUMERIC DEFAULT 0,
  making_charges NUMERIC DEFAULT 0,
  stone_weight NUMERIC DEFAULT 0,
  gst_amount NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  final_amount NUMERIC DEFAULT 0,
  invoice_number TEXT UNIQUE,
  payment_method TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INVOICES ────────────────────────────────────────
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id),
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'generated',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AUDIT LOGS ──────────────────────────────────────
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  performed_by UUID REFERENCES staff(id),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SEED DATA ───────────────────────────────────────
INSERT INTO sections (name, display_name, display_order, color) VALUES
  ('reception', 'Reception', 0, '#F59E0B'),
  ('gold', 'Gold Section', 1, '#D4AF37'),
  ('silver', 'Silver Section', 2, '#C0C0C0'),
  ('diamond', 'Diamond Section', 3, '#6366F1'),
  ('platinum', 'Platinum Section', 4, '#E5E4E2')
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name;

INSERT INTO staff (username, password_hash, full_name, email, role, assigned_section, is_active) VALUES
  ('admin', 'admin123', 'System Admin', 'admin@royal.com', 'admin', 'reception', true),
  ('reception1', 'emp123', 'Priya Receptionist', 'reception@royal.com', 'receptionist', 'reception', true),
  ('gold_mgr', 'emp123', 'Raj Kumar', 'raj@royal.com', 'section_manager', 'gold', true),
  ('silver_mgr', 'emp123', 'Amit Patel', 'amit@royal.com', 'section_manager', 'silver', true),
  ('diamond_mgr', 'emp123', 'Vikram Singh', 'vikram@royal.com', 'section_manager', 'diamond', true),
  ('platinum_mgr', 'emp123', 'Rohan Mehta', 'rohan@royal.com', 'section_manager', 'platinum', true)
ON CONFLICT (username) DO NOTHING;

-- ─── SECURITY POLICIES ───────────────────────────────
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all development" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all development" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all development" ON sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all development" ON tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all development" ON movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all development" ON section_time_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all development" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all development" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all development" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DONE
-- ============================================================
