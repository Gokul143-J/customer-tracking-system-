-- ============================================================
-- ROYAL JEWELLERS CRM - SUPABASE DATABASE SCHEMA
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to set up all tables
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. STAFF TABLE (for admin and employee login)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,  -- In production, use proper hashing (bcrypt, etc.)
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'receptionist',  -- admin, receptionist, sales_executive, floor_manager, store_manager
  store_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CUSTOMERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT,
  age INTEGER,
  city TEXT,
  remarks TEXT,
  visit_count INTEGER DEFAULT 1,
  first_visit TIMESTAMPTZ DEFAULT NOW(),
  last_visit TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast phone lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ============================================================
-- 3. SECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TICKETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  created_by UUID REFERENCES staff(id),
  store_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, COMPLETED, CLOSED, CANCELLED, NO_PURCHASE
  interested_products TEXT[] DEFAULT '{}',
  current_section TEXT NOT NULL DEFAULT 'reception',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);

-- ============================================================
-- 5. MOVEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  customer_id UUID REFERENCES customers(id),
  from_section TEXT NOT NULL,
  to_section TEXT NOT NULL,
  assigned_by UUID REFERENCES staff(id),
  assigned_to UUID REFERENCES staff(id),
  reason TEXT,
  notes TEXT,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movements_ticket ON movements(ticket_id);

-- ============================================================
-- 6. SALES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  customer_id UUID REFERENCES customers(id),
  salesperson_id UUID REFERENCES staff(id),
  store_id TEXT,
  products JSONB DEFAULT '[]',
  total_weight NUMERIC DEFAULT 0,
  making_charges NUMERIC DEFAULT 0,
  stone_weight NUMERIC DEFAULT 0,
  gst_amount NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  final_amount NUMERIC DEFAULT 0,
  invoice_number TEXT,
  payment_method TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. INVOICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id),
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'generated',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  performed_by UUID REFERENCES staff(id),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED DATA - Default Sections
-- ============================================================
INSERT INTO sections (name, display_name, display_order, is_active) VALUES
  ('gold_ring', 'Gold Ring', 1, true),
  ('gold_bangle', 'Gold Bangle', 2, true),
  ('gold_chain', 'Gold Chain', 3, true),
  ('necklace', 'Necklace', 4, true),
  ('diamond', 'Diamond', 5, true),
  ('silver', 'Silver', 6, true),
  ('platinum', 'Platinum', 7, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED DATA - Default Admin Account
-- ============================================================
-- Default admin: username "admin", password "admin123"
-- CHANGE THE PASSWORD IN PRODUCTION!
INSERT INTO staff (username, password_hash, full_name, email, role, is_active) VALUES
  ('admin', 'admin123', 'System Admin', 'admin@royaljewellers.com', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- SEED DATA - Sample Employee Account
-- ============================================================
INSERT INTO staff (username, password_hash, full_name, email, role, is_active) VALUES
  ('employee1', 'emp123', 'Rahul Sharma', 'rahul@royaljewellers.com', 'receptionist', true),
  ('sales1', 'sales123', 'Priya Patel', 'priya@royaljewellers.com', 'sales_executive', true)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- SUPABASE SECURITY (Row Level Security)
-- For development, you can disable RLS. For production, enable it:
-- ============================================================
-- ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- For development, allow all access (remove in production):
CREATE POLICY "Allow all for development" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON sections FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DONE! Your database is ready.
-- ============================================================
-- Now:
-- 1. Copy your Supabase URL and anon key from Settings > API
-- 2. Create a .env.local file with:
--    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
-- 3. Run: npm install && npm run dev
-- ============================================================
