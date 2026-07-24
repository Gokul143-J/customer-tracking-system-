# 🏪 Royal Jewellers CRM - Complete Restructure Guide

##  What's New

### 5 Sections (Simplified)
- **Reception** - Customer entry, ticket generation
- **Gold Section** - Gold jewelry
- **Silver Section** - Silver jewelry  
- **Diamond Section** - Diamond jewelry
- **Platinum Section** - Platinum jewelry

---

## 🎯 New Workflow

```
1. CUSTOMER arrives at RECEPTION
   ↓
2. RECEPTIONIST generates ticket
   - Enters customer details
   - Selects "Assign to Section" (Gold/Silver/Diamond/Platinum)
   - Ticket created with QR code
   ↓
3. CUSTOMER goes to assigned section
   ↓
4. SECTION EMPLOYEE sees customer in their dashboard
   - Clicks "Check In" OR scans QR
   - Timer starts
   ↓
5. When customer is done:
   ├─ BUYING? → "Sale" button → Invoice & checkout
   └─ NOT BUYING? → "Check Out" → 
       ├─ Send to another section, OR
       └─ Customer leaves store (ticket closed)
```

---

##  Employee Accounts

| Username | Password | Section | Role |
|----------|----------|---------|------|
| `admin` | `admin123` | Reception | Admin |
| `employee1` | `emp123` | Reception | Receptionist |
| `gold_emp` | `emp123` | Gold | Sales Executive |
| `silver_emp` | `emp123` | Silver | Sales Executive |
| `diamond_emp` | `emp123` | Diamond | Sales Executive |
| `platinum_emp` | `emp123` | Platinum | Sales Executive |

---

## 🔧 Setup Steps

### Step 1: Run Database Migration

Go to **Supabase SQL Editor** and run:

```sql
-- Add assigned_section column
ALTER TABLE staff ADD COLUMN IF NOT EXISTS assigned_section TEXT;

-- Update existing staff
UPDATE staff SET assigned_section = 'reception' WHERE username = 'admin';
UPDATE staff SET assigned_section = 'reception' WHERE username = 'employee1';

-- Create section_time_logs table
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

-- Add section employees
INSERT INTO staff (username, password_hash, full_name, email, role, assigned_section, is_active) VALUES
  ('gold_emp', 'emp123', 'Raj Kumar', 'raj@royal.com', 'sales_executive', 'gold', true),
  ('silver_emp', 'emp123', 'Amit Patel', 'amit@royal.com', 'sales_executive', 'silver', true),
  ('diamond_emp', 'emp123', 'Vikram Singh', 'vikram@royal.com', 'sales_executive', 'diamond', true),
  ('platinum_emp', 'emp123', 'Rohan Mehta', 'rohan@royal.com', 'sales_executive', 'platinum', true)
ON CONFLICT (username) DO NOTHING;
```

Click **Run** ✅

### Step 2: Update Sections

```sql
DELETE FROM sections;
INSERT INTO sections (name, display_name, display_order, is_active) VALUES
  ('reception', 'Reception', 0, true),
  ('gold', 'Gold Section', 1, true),
  ('silver', 'Silver Section', 2, true),
  ('diamond', 'Diamond Section', 3, true),
  ('platinum', 'Platinum Section', 4, true);
```

### Step 3: Install Dependencies

```bash
cd customer-tracking-system-/frontend
npm install
```

### Step 4: Restart Server

```bash
npm run dev
```

---

## 🖥️ Admin Portal

**Login:** `admin` / `admin123`

### New Features:
- **Dashboard** - Overview with metrics
- **Track Customers** - Real-time tracking with time spent per section
- **Analytics** - Charts and insights
- **Customer Details** - Full customer database
- **Customer Activities** - Activity log
- **Employees** ⭐ NEW - Manage employees per section
  - Add new employees
  - Assign to sections (Reception/Gold/Silver/Diamond/Platinum)
  - Enable/disable accounts
  - Edit employee details
- **Settings** - System configuration

---

## 👷 Employee Portal

### Reception Employee (`employee1` / `emp123`)

**Pages:**
1. **New Ticket (Reception)** - Generate tickets
   - Customer details
   - 10-digit phone validation
   - **Assign to Section** dropdown (Gold/Silver/Diamond/Platinum)
   - QR code generated
2. **Invoice Generation** - Create invoices
3. **Sales & Billing** - Process sales
4. **All Tickets** - View all tickets

### Section Employee (e.g., `gold_emp` / `emp123`)

**Pages:**
1. **My Section: Gold Section** ⭐ NEW - Main dashboard
   - Shows ONLY customers assigned to Gold section
   - Scanner for QR check-in
   - Manual ticket input
   - Check In / Check Out buttons
   - Sale button for purchases
2. **Sales & Billing** - Process sales
3. **Invoice Generation** - Create invoices
4. **My Tickets** - View tickets

---

##  How Section Employees Work

### Dashboard View

When a section employee logs in, they see:
- Their section name (e.g., "Gold Section")
- Count of customers in their section
- Customer cards showing:
  - Name, phone, ticket number
  - Entry time
  - Status: "In Section" (checked in) or waiting

### Check-In Process

**Option 1: QR Scanner**
1. Click "Scan QR Code"
2. Point camera at customer's ticket QR
3. System auto-checks in customer
4. Timer starts

**Option 2: Manual Input**
1. Type ticket number (e.g., `JR-2026-68252`)
2. Click "Enter"
3. Customer checked in

**Option 3: Click "Check In" Button**
- On customer card, click "Check In"
- Instant check-in

### Check-Out Process

When customer is ready to leave section:

1. Click **"Check Out"** on customer card
2. Modal appears with 2 options:
   - **"Customer is Buying → Go to Billing"** - Redirects to sales page
   - **"Customer is Leaving"** - Options:
     - Send to another section (prompts for section)
     - Close ticket (customer leaving store)

---

##  Demo Scenario

### Customer Journey: "Priya Sharma"

**Step 1: Reception**
- Login: `employee1` / `emp123`
- Go to "New Ticket (Reception)"
- Enter: Priya Sharma, 9876543210
- Assign to Section: **Gold**
- Generate ticket: `JR-2026-68252`
- Show QR code to customer

**Step 2: Gold Section**
- Login: `gold_emp` / `emp123`
- See Priya in "My Section: Gold Section"
- Click "Check In" (or scan QR)
- ✅ Priya checked in, timer starts

**Step 3: Priya browses gold jewelry**
- Employee can see her in the dashboard
- Timer running

**Step 4: Priya wants to buy**
- Employee clicks "Sale" button
- Goes to Sales & Billing
- Process sale, generate invoice
- ✅ Ticket closed

**OR**

**Step 4: Priya not buying, wants to see diamonds**
- Employee clicks "Check Out"
- Select "Customer is Leaving"
- Choose "Send to another section"
- Enter: `diamond`
- ✅ Priya sent to Diamond section

**Step 5: Diamond Section**
- Login: `diamond_emp` / `emp123`
- See Priya in Diamond section dashboard
- Check in, continue journey...

---

##  Admin Tracking

### Track Customers Page

Admin can see:
- All active tickets
- Current section of each customer
- Click any ticket to see:
  - **Time Spent in Each Section** cards
  - **Journey Timeline** with movement history

Example:
```
Reception → Gold (5 min 30 sec)
Gold → Diamond (3 min 15 sec)
Diamond → Silver (2 min 45 sec)
Total: 11 min 30 sec
```

### Customer Details Page

- Search any customer
- See all visits
- Time spent per section across all visits
- Complete history

---

## 🌐 Deploy to Vercel (For Teammates)

### Push to GitHub

```bash
cd customer-tracking-system-
git add .
git commit -m "feat: Complete restructure"
git push origin main
```

### Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your repo
3. Configure:
   - **Root Directory:** `frontend`
   - **Environment Variables:**
     ```
     NEXT_PUBLIC_SUPABASE_URL = https://bdvjidfkvypgpipizwvnm.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY = (your key)
     ```
4. Deploy

### Share URL

You'll get: `https://your-app.vercel.app`

Share with teammates:
- Reception: Login as `employee1`
- Gold: Login as `gold_emp`
- Silver: Login as `silver_emp`
- Diamond: Login as `diamond_emp`
- Platinum: Login as `platinum_emp`

Each person sees only their section!

---

## ✅ Key Features Implemented

✅ **5 Sections** - Reception, Gold, Silver, Diamond, Platinum
✅ **Reception-only ticket generation** - "Assign to Section" dropdown
✅ **QR code on tickets** - Scan for quick lookup
✅ **Section-based employee views** - Each sees only their section
✅ **Check-in/Check-out system** - Automatic time tracking
✅ **Admin employee management** - Add/edit/assign employees to sections
✅ **10-digit phone validation** - Exactly 10 digits required
✅ **Time tracking per section** - Duration logged automatically
✅ **Dynamic navigation** - Different menus for reception vs section employees
✅ **Auto-redirect on login** - Based on assigned section

---

## 🎉 You're Ready!

The system is now fully restructured for a realistic showroom workflow:

1. **Reception** generates tickets and assigns sections
2. **Section employees** only see their section's customers
3. **Check-in/Check-out** tracks time automatically
4. **Admin** manages everything and tracks all activity

For your demo:
- Deploy to Vercel
- Give each teammate their section login
- Walk through a customer journey
- Show admin dashboard with time tracking data

Everything is ready! 🚀
