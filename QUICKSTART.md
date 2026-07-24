# 🚀 Quick Start Guide

## 1-Minute Setup

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization and give it a name
4. Set a strong database password
5. Select region closest to you
6. Click "Create new project"

### Step 2: Run Database Setup
1. In your Supabase project, click "SQL Editor" in the left sidebar
2. Click "New query"
3. Copy the entire contents of `frontend/SUPABASE_SETUP.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned" or similar

### Step 3: Get API Credentials
1. In Supabase, click "Settings" (gear icon) in the left sidebar
2. Click "API" in the settings menu
3. Copy the "Project URL" (looks like: `https://xxxxx.supabase.co`)
4. Scroll down to "Project API keys"
5. Copy the "anon public" key (long string starting with `eyJ...`)

### Step 4: Configure Your App
1. Navigate to the `frontend` folder in your project
2. Create a file named `.env.local`
3. Add these two lines (replace with your actual values):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Save the file

### Step 5: Install and Run
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Step 6: Access the Application
1. Open your browser
2. Go to `http://localhost:3000`
3. You should see the landing page with two login options

---

## 🔑 Test Credentials

### Admin Access
- **URL**: Click "Admin Portal" on landing page
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Full system control

### Reception Access
- **URL**: Click "Employee Portal" on landing page
- **Username**: `reception1`
- **Password**: `emp123`
- **Access**: Create tickets, manage customers

### Section Manager Access
| Username | Password | Section |
|----------|----------|---------|
| `gold_mgr` | `emp123` | Gold Section |
| `silver_mgr` | `emp123` | Silver Section |
| `diamond_mgr` | `emp123` | Diamond Section |
| `platinum_mgr` | `emp123` | Platinum Section |

---

## 🎯 First Test: Complete Customer Journey

### 1. Create a Ticket (as Receptionist)
1. Login as `reception1` / `emp123`
2. Click "New Ticket"
3. Enter customer details:
   - Name: Test Customer
   - Phone: 9876543210 (must start with 6-9)
   - Gender: Female
   - Age: 28
   - Assign to: Diamond
4. Click "Generate Ticket"
5. Note the ticket number and QR code

### 2. Check-In Customer (as Section Manager)
1. Logout and login as `diamond_mgr` / `emp123`
2. You should see "Test Customer" in your section
3. Click "Check In" button
4. Customer is now checked in to Diamond section

### 3. Process Sale (Optional)
1. Click "Check Out" on the customer card
2. Choose "Customer is Buying → Go to Billing"
3. Enter sale details:
   - Making Charges: 5000
   - GST Amount: 900
   - Final Amount: 5900
   - Payment Method: UPI
4. Click "Complete Sale & Close Ticket"

### 4. Final Checkout (as Receptionist)
1. Logout and login as `reception1` / `emp123`
2. Go to "All Tickets"
3. Find the test ticket
4. Click on it to open details
5. Click "Close Ticket — Customer Left Shop"
6. Select reason: "Browse only"

---

##  Troubleshooting

### "Invalid credentials" Error
- Double-check username and password
- Ensure no extra spaces
- Verify Supabase connection in `.env.local`

### "Failed to fetch" or Network Error
- Check your internet connection
- Verify Supabase project is active (not paused)
- Try: `ipconfig /flushdns` in Command Prompt
- Try using mobile hotspot

### Page Not Loading
- Make sure you're in the `frontend` directory
- Run `npm install` again
- Try deleting `node_modules` and `package-lock.json`, then `npm install`

### Database Tables Not Found
- Run the SQL setup script again
- Check Supabase SQL Editor for errors
- Verify all tables exist in "Table Editor"

---

## 📱 Testing on Mobile/Other Devices

### Option 1: Local Network Access
1. Find your computer's IP address:
   - Windows: `ipconfig` → look for IPv4 Address
   - Mac: `ifconfig` → look for en0
2. On other device, go to: `http://YOUR_IP:3000`
3. Note: Camera features require HTTPS (use Vercel deployment)

### Option 2: Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set root directory to `frontend`
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Deploy
7. Share the generated URL with your team

---

## 🎓 Next Steps

### For Development
- Explore the admin dashboard analytics
- Test VIP customer recognition (create customer with 3+ visits)
- Try transferring customers between sections
- Generate multiple tickets and track movements

### For Production
- Change all default passwords
- Implement proper password hashing
- Enable stricter RLS policies in Supabase
- Set up HTTPS for all connections
- Configure proper error logging
- Add rate limiting

---

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for errors (F12 → Console tab)
2. Check Supabase logs in the dashboard
3. Verify all environment variables are correct
4. Ensure all database tables exist

---

**Happy Testing! **
