# Royal Jewellers CRM - Customer Tracking System

A modern, interactive customer journey management system for jewellery showrooms. Built with Next.js 15, React 19, Tailwind CSS, and Supabase.

## ✨ Features

### Admin Portal
- **Dashboard** — Beautiful real-time overview with metrics, charts, and live activity feed
- **Track Customers** — Real-time customer tracking across showroom sections with detailed journey timelines
- **Analytics** — Revenue trends, footfall analysis, section occupancy, conversion rates
- **Customer Details** — Complete customer database with visit history, section tracking, and demographics
- **Customer Activities** — Full activity log of all customer movements and actions
- **Settings** — Staff management, audit logs, and system configuration

### Employee Portal
- **Ticket Generation** — Register visitors with validated 10-digit mobile numbers, generate digital tickets
- **Invoice Generation** — Generate invoices for completed sales with print/download options
- **Sales & Billing** — Process sales, close tickets, and manage billing operations
- **My Tickets** — View all tickets with full customer journey timelines

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Icons**: Lucide React
- **No Docker** — Direct Supabase connection

## 🚀 Setup Instructions

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy and paste the contents of `frontend/SUPABASE_SETUP.sql` and run it
4. This creates all tables, seed data, and default accounts

### 2. Configure Environment Variables
Create a file `frontend/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from Supabase: **Settings → API → Project URL & anon/public key**

### 3. Install & Run
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

### 4. Default Login Credentials

**Admin Portal:**
- Username: `admin`
- Password: `admin123`

**Employee Portal:**
- Username: `employee1` (Receptionist)
- Password: `emp123`

- Username: `sales1` (Sales Executive)
- Password: `sales123`

> ⚠️ **IMPORTANT**: Change all default passwords before going to production!

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page (choose Admin or Employee)
│   │   ├── admin-login/          # Admin login page
│   │   ├── employee-login/       # Employee login page
│   │   ├── admin/                # Admin portal
│   │   │   ├── layout.tsx        # Admin sidebar & navigation
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   ├── track-customers/  # Track customers
│   │   │   ├── analytics/        # Analytics & charts
│   │   │   ├── customer-details/ # Customer database
│   │   │   ├── customer-activities/ # Activity log
│   │   │   └── settings/         # Staff management & audit
│   │   └── employee/             # Employee portal
│   │       ├── layout.tsx        # Employee sidebar & navigation
│   │       ├── ticket-generation/ # New ticket creation
│   │       ├── invoice-generation/ # Invoice management
│   │       ├── sales-billing/    # Sales & billing
│   │       └── my-tickets/       # All tickets
│   ├── context/
│   │   └── AuthContext.tsx       # Authentication context
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabase client
│   │   │   └── database.ts       # API functions
│   │   └── utils.ts              # Utility functions
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   └── components/
│       └── MetricCard.tsx         # Dashboard metric card
├── .env.local.example
├── SUPABASE_SETUP.sql            # Database schema
└── package.json
```

## 🔒 Security Notes

- The current implementation uses simple password matching for development
- For production, implement proper password hashing (bcrypt) or use Supabase Auth
- Enable Row Level Security (RLS) policies in Supabase for production
- Use environment variables for all sensitive configuration
