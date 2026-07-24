#  Royal Jewellers CRM - Final Setup Guide

##  3 Roles (Simplified)

1. **Admin** - Full system access, manage employees, view all data
2. **Receptionist** - Generate tickets, create invoices, process sales
3. **Section Manager** - Manage their assigned section (Gold/Silver/Diamond/Platinum)

---

##  Employee Accounts

| Username | Password | Role | Section |
|----------|----------|------|---------|
| `admin` | `admin123` | Admin | Reception |
| `reception1` | `emp123` | Receptionist | Reception |
| `gold_mgr` | `emp123` | Section Manager | Gold |
| `silver_mgr` | `emp123` | Section Manager | Silver |
| `diamond_mgr` | `emp123` | Section Manager | Diamond |
| `platinum_mgr` | `emp123` | Section Manager | Platinum |

---

## 🔧 Setup Steps

### Step 1: Run Complete Database Reset

Go to **Supabase SQL Editor** and run this complete script:

```sql
-- Drop all tables and start fresh
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS section_time_logs CASCADE;
DROP TABLE IF EXISTS movements CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create staff table with role constraint
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

-- Create customers table
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

-- Create sections table
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('reception','gold','silver','diamond','platinum')),
  display_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#D4AF37',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tickets table
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

-- Create movements table
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

-- Create section_time_logs table
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

-- Create sales table
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

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id),
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'generated',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
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

-- Insert sections
INSERT INTO sections (name, display_name, display_order, color) VALUES
  ('reception', 'Reception', 0, '#F59E0B'),
  ('gold', 'Gold Section', 1, '#D4AF37'),
  ('silver', 'Silver Section', 2, '#C0C0C0'),
  ('diamond', 'Diamond Section', 3, '#6366F1'),
  ('platinum', 'Platinum Section', 4, '#E5E4E2');

-- Insert staff accounts
INSERT INTO staff (username, password_hash, full_name, email, role, assigned_section, is_active) VALUES
  ('admin', 'admin123', 'System Admin', 'admin@royal.com', 'admin', 'reception', true),
  ('reception1', 'emp123', 'Priya Receptionist', 'reception@royal.com', 'receptionist', 'reception', true),
  ('gold_mgr', 'emp123', 'Raj Kumar', 'raj@royal.com', 'section_manager', 'gold', true),
  ('silver_mgr', 'emp123', 'Amit Patel', 'amit@royal.com', 'section_manager', 'silver', true),
  ('diamond_mgr', 'emp123', 'Vikram Singh', 'vikram@royal.com', 'section_manager', 'diamond', true),
  ('platinum_mgr', 'emp123', 'Rohan Mehta', 'rohan@royal.com', 'section_manager', 'platinum', true);

-- Enable Row Level Security (development mode - allow all)
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON section_time_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
```

### Step 2: Install Dependencies

```bash
cd customer-tracking-system-/frontend
npm install
```

### Step 3: Start Server

```bash
npm run dev
```

---

##  Edge Cases Handled

### Phone Validation
- ✅ Exactly 10 digits required
- ✅ Must start with 6, 7, 8, or 9 (Indian mobile numbers)
- ✅ No letters or special characters allowed
- ✅ Real-time validation with error messages

### Duplicate Tickets
- ✅ Cannot create ticket if customer already has an active ticket
- ✅ Shows error with existing ticket number

### Section Access Control
- ✅ Each section manager sees ONLY their assigned section
- ✅ Cannot check in customer to wrong section
- ✅ Cannot scan inactive tickets

### Network Errors
- ✅ User-friendly error messages
- ✅ Retry mechanisms
- ✅ Graceful fallbacks

### Concurrent Access
- ✅ Prevents duplicate check-ins
- ✅ Handles race conditions with status checks

### Invalid Inputs
- ✅ Age validation (0-150)
- ✅ Required field validation
- ✅ Role-based access control

### Session Management
- ✅ Auto-redirect based on role
- ✅ Proper logout handling
- ✅ Session persistence

---

##  Workflow

### Receptionist Flow
1. Login as `reception1` / `emp123`
2. Generate ticket with customer details
3. Assign to section (Gold/Silver/Diamond/Platinum)
4. QR code generated automatically
5. Customer directed to assigned section

### Section Manager Flow
1. Login as `gold_mgr` / `emp123` (or other section)
2. See only customers assigned to their section
3. Scan QR or click "Check In"
4. Timer starts automatically
5. When customer is done:
   - **Buying?** → Click "Sale" → Process invoice
   - **Not buying?** → Click "Check Out" → Send to next section or close ticket

### Admin Flow
1. Login as `admin` / `admin123`
2. View dashboard with all metrics
3. Manage employees (add/edit/assign sections)
4. Track all customers across sections
5. View analytics and reports

---

##  Testing Checklist

- [ ] Admin can login and access all pages
- [ ] Receptionist can generate tickets
- [ ] Section manager sees only their section
- [ ] Phone validation works (10 digits, starts with 6-9)
- [ ] Cannot create duplicate active tickets
- [ ] QR scan works for check-in
- [ ] Check-out process works (buying vs leaving)
- [ ] Time tracking logs correctly
- [ ] Employee management works (add/edit/disable)
- [ ] Role-based navigation works correctly

---

##  Credentials Summary

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Admin | `admin` | `admin123` | Full system |
| Receptionist | `reception1` | `emp123` | Ticket generation, invoices, sales |
| Gold Manager | `gold_mgr` | `emp123` | Gold section only |
| Silver Manager | `silver_mgr` | `emp123` | Silver section only |
| Diamond Manager | `diamond_mgr` | `emp123` | Diamond section only |
| Platinum Manager | `platinum_mgr` | `emp123` | Platinum section only |

---

## 🚀 Ready to Go!

Run the SQL script, install dependencies, and start the server. Everything is configured and edge cases are handled!
