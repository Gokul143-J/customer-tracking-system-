# 📱 QR Section Scanner - Complete Setup Guide

## 🎯 How It Works

Each employee is **assigned to a specific section** (e.g., Gold Bangle, Diamond, etc.). When they scan a customer's QR code:

1. ✅ System logs **exit from previous section** with duration
2. ✅ System logs **entry to their section** with timestamp
3. ✅ Updates ticket's current section automatically
4. ✅ No dropdown, no selection needed — just scan and go!

---

##  Setup Steps

### Step 1: Install Dependencies

```bash
cd customer-tracking-system-/frontend
npm install
```

This installs the `html5-qrcode` library for camera scanning.

---

### Step 2: Update Supabase Database

Go to **Supabase SQL Editor** and run this query:

```sql
-- Add assigned_section column to staff
ALTER TABLE staff ADD COLUMN IF NOT EXISTS assigned_section TEXT;

-- Update existing staff with their sections
UPDATE staff SET assigned_section = 'reception' WHERE username = 'admin';
UPDATE staff SET assigned_section = 'gold_bangle' WHERE username = 'employee1';
UPDATE staff SET assigned_section = 'diamond' WHERE username = 'sales1';

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

-- Add more employee accounts for each section (for demo)
INSERT INTO staff (username, password_hash, full_name, email, role, assigned_section, is_active) VALUES
  ('goldring', 'emp123', 'Raj Kumar', 'raj@royal.com', 'sales_executive', 'gold_ring', true),
  ('goldchain', 'emp123', 'Amit Patel', 'amit@royal.com', 'sales_executive', 'gold_chain', true),
  ('necklace', 'emp123', 'Sara Ali', 'sara@royal.com', 'sales_executive', 'necklace', true),
  ('diamond_emp', 'emp123', 'Vikram Singh', 'vikram@royal.com', 'sales_executive', 'diamond', true),
  ('silver_emp', 'emp123', 'Neha Gupta', 'neha@royal.com', 'sales_executive', 'silver', true),
  ('platinum_emp', 'emp123', 'Rohan Mehta', 'rohan@royal.com', 'sales_executive', 'platinum', true)
ON CONFLICT (username) DO NOTHING;
```

Click **Run**. ✅

---

### Step 3: Restart Dev Server

```bash
npm run dev
```

---

## 👥 Employee Accounts (For Demo)

| Username | Password | Section | Role |
|----------|----------|---------|------|
| `goldring` | `emp123` | Gold Ring | Sales Executive |
| `goldbangle` | `emp123` | Gold Bangle | Sales Executive |
| `goldchain` | `emp123` | Gold Chain | Sales Executive |
| `necklace` | `emp123` | Necklace | Sales Executive |
| `diamond_emp` | `emp123` | Diamond | Sales Executive |
| `silver_emp` | `emp123` | Silver | Sales Executive |
| `platinum_emp` | `emp123` | Platinum | Sales Executive |

---

## 📱 How to Use the Scanner

### For Each Employee:

1. **Login** to Employee Portal with their credentials
2. Click **"Scan Section"** in the sidebar
3. The page shows:
   - Their assigned section (top right badge)
   - Camera view for QR scanning
   - Manual input option (backup)
   - Recent scans history

### Scanning Process:

```
1. Employee clicks "Start Camera"
2. Points camera at customer's ticket QR code
3. QR is detected automatically
4. System shows:
   ✅ Customer name, phone, ticket number
   ✅ Previous section → New section
   ✅ Timestamp
5. Customer's section is updated automatically
6. Time tracking starts for new section
```

### Manual Input (Backup):

If camera doesn't work:
1. Click **"Manual"** tab
2. Type ticket number (e.g., `JR-2026-68252`)
3. Click **"Log Section Entry"**
4. Same result as scanning

---

## 🌐 Deploy to Vercel (For Teammates)

To let teammates use this on their phones/laptops:

### Step 1: Push to GitHub

```bash
cd customer-tracking-system-
git add .
git commit -m "feat: QR scanner ready"
git push origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **"New Project"**
4. Import your `customer-tracking-system-` repo
5. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Environment Variables:**
     ```
     NEXT_PUBLIC_SUPABASE_URL = https://bdvjidfkvypgpipizwvnm.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY = (your anon key from Supabase)
     ```
6. Click **Deploy**
7. Wait 2-3 minutes

### Step 3: Share URL with Teammates

You'll get a URL like:
```
https://royal-jewellers-crm.vercel.app
```

Share this with your teammates! They can:
- Open on any phone/laptop
- Login with their employee credentials
- Use the QR scanner (camera works because it's HTTPS ✅)

---

## 🎬 Demo Workflow

Here's how to demonstrate this in your presentation:

### Scenario: Customer Journey Through Showroom

**Setup:**
- 7 employees logged in on different devices (or tabs)
- Each handling a different section

**Flow:**

1. **Reception** (`employee1` / `emp123`)
   - Customer "Thalapathy" enters
   - Generate ticket with QR code
   - Ticket: `JR-2026-68252`

2. **Gold Bangle** (`employee1` scans QR)
   - Customer moves to Gold Bangle section
   - Scan QR → Auto-logs entry
   - Timer starts

3. **Diamond** (`diamond_emp` / `emp123`)
   - Customer interested in diamonds
   - Diamond employee scans QR
   - System logs: "Exited Gold Bangle (5 min 30 sec)"
   - System logs: "Entered Diamond at 2:35 PM"

4. **Necklace** (`necklace` / `emp123`)
   - Customer moves to Necklace
   - Scan QR → Auto-logs transition

5. **Admin Dashboard**
   - Open Admin portal
   - Go to "Track Customers"
   - Click on customer ticket
   - See complete journey:
     - Reception → Gold Bangle (2 min)
     - Gold Bangle → Diamond (5 min 30 sec)
     - Diamond → Necklace (3 min 15 sec)
   - Total time tracked: 10 min 45 sec

---

## 📊 View Time Tracking Data

### Admin: Track Customers Page
- Click any ticket
- See "Time Spent in Each Section" cards
- See complete journey timeline

### Admin: Customer Details Page
- Search for customer
- See all visits
- See time spent per section across all visits

---

## 🔧 Troubleshooting

### Camera Not Working
- Must use **HTTPS** (Vercel deployment) or **localhost**
- Check browser permissions → Allow camera
- Try "Manual" input as backup

### "Ticket Not Found" Error
- Check ticket number is correct
- Ticket must be **ACTIVE** status
- Ticket cannot be already in the same section

### "Invalid Credentials" Error
- Check username/password
- Employee must have `assigned_section` set in database
- Run the SQL migration from Step 2

---

## ✅ Testing Checklist

- [ ] SQL migration ran successfully
- [ ] Employee accounts created with assigned sections
- [ ] `npm install` completed (html5-qrcode installed)
- [ ] Dev server restarted
- [ ] Login as employee → See "Scan Section" in sidebar
- [ ] Generate a test ticket from reception
- [ ] Scan QR → Customer section updates
- [ ] Check admin dashboard → See time tracking data

---

## 🎉 You're Ready!

Your QR section tracking system is now complete. Each employee just needs to:

1. Login
2. Click "Scan Section"
3. Point camera at customer's QR code
4. Done! Everything is automatic.

For your demo, deploy to Vercel and share the URL with teammates. They can use their phones to scan QR codes in real-time!
