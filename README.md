# Royal Jewellers CRM - Customer Tracking System

A modern, role-based customer journey management system for jewellery showrooms. Built with Next.js 15, React 19, TypeScript, Tailwind CSS, and Supabase.

##  Features

### Role-Based Access
- **Admin**: Full system access, employee management, analytics
- **Receptionist**: Ticket generation, customer lookup, final checkout
- **Section Manager**: Section-specific customer management, check-in/out, transfers

### Core Functionality
- QR code ticket generation with unique IDs
- Real-time section tracking with time logging
- Automatic section assignment based on customer profile
- VIP customer recognition (3+ visits)
- Sales processing with invoice generation
- Movement history and time analytics
- Live activity feed on admin dashboard

### Security
- Role-based route protection
- Section isolation for managers
- Input validation (phone, age, names)
- Duplicate ticket prevention

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Icons**: Lucide React
- **QR Codes**: qrcode.react

---

## 🚀 Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the schema from `frontend/SUPABASE_SETUP.sql`

### 2. Configure Environment Variables
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install & Run
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

---

## 👥 Default Credentials

### Admin
- Username: `admin`
- Password: `admin123`

### Receptionist
- Username: `reception1`
- Password: `emp123`

### Section Managers
| Username | Password | Section |
|----------|----------|---------|
| `gold_mgr` | `emp123` | Gold |
| `silver_mgr` | `emp123` | Silver |
| `diamond_mgr` | `emp123` | Diamond |
| `platinum_mgr` | `emp123` | Platinum |

---

##  Project Structure

```
frontend/
── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout with AuthProvider
│   │   ├── admin-login/          # Admin authentication
│   │   ├── employee-login/       # Employee authentication
│   │   ├── admin/                # Admin portal
│   │   │   ├── dashboard/        # Metrics & live feed
│   │   │   ├── employees/        # Staff management
│   │   │   ├── track-customers/  # Real-time tracking
│   │   │   ├── analytics/        # Charts & insights
│   │   │   ├── customer-details/ # Customer database
│   │   │   └── settings/         # System config
│   │   └── employee/             # Employee portal
│   │       ├── ticket-generation/# Reception ticket creation
│   │       ├── section-view/     # Section manager dashboard
│   │       ├── sales-billing/    # Sales processing
│   │       ├── invoice-generation/# Invoice management
│   │       └── my-tickets/       # Ticket list
│   ├── components/
│   │   ├── Toast.tsx             # Notification component
│   │   ├── Skeleton.tsx          # Loading states
│   │   └── Particles.tsx         # Landing animation
│   ├── context/
│   │   └── AuthContext.tsx       # Authentication context
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabase client
│   │   │   └── database.ts       # API functions
│   │   └── utils.ts              # Utility functions
│   └── types/
│       └── index.ts              # TypeScript types
└── .env.local.example            # Environment template
```

---

## 🔄 Customer Journey Flow

1. **Reception**: Customer arrives → Ticket generated → Assigned to section
2. **Section Entry**: Manager scans QR → Check-in → Timer starts
3. **Section Exit**: Manager checks out → Transfer to next section OR mark for billing
4. **Billing**: Sales processed → Invoice generated → Ticket completed
5. **Final Checkout**: Receptionist closes ticket → Customer leaves

---

##  Key Features

### Smart Section Assignment
Auto-suggests section based on gender and age:
- Female < 30 → Diamond
- Female ≥ 30 → Gold
- Male < 25 → Silver
- Male 25-40 → Gold
- Male ≥ 40 → Platinum

### VIP Recognition
Customers with 3+ visits receive VIP badge and special treatment.

### Time Tracking
Automatic logging of time spent in each section with movement history.

### Duplicate Prevention
System prevents creating tickets for customers with active tickets.

---

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |

---

## 📊 Database Schema

### Core Tables
- `staff` - Employee accounts with role and section assignment
- `customers` - Customer profiles with visit history
- `tickets` - Active/completed tickets with section assignment
- `movements` - Section transition records
- `section_time_logs` - Time spent in each section
- `sales` - Sale transactions
- `invoices` - Generated invoices
- `sections` - Store sections (gold, silver, diamond, platinum)
- `audit_logs` - System audit trail

---

## 🚢 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Set root directory to `frontend`
4. Add environment variables
5. Deploy

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

##  Security Notes

- Current implementation uses plain text passwords for demo purposes
- For production, implement proper password hashing (bcrypt/argon2)
- Enable Row Level Security (RLS) policies in Supabase
- Use HTTPS for all connections
- Implement rate limiting for authentication endpoints

---

## 📝 License

This project is for educational/demo purposes.

---

## 🤝 Support

For issues or questions, please contact the development team.
