# 🏗️ Developer Setup Guide

## Architecture Overview

### Tech Stack
- **Frontend Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Icons**: Lucide React
- **QR Codes**: qrcode.react

### Project Structure
```
customer-tracking-system/
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── layout.tsx         # Root layout
│   │   │   ├── admin-login/       # Admin authentication
│   │   │   ├── employee-login/    # Employee authentication
│   │   │   ├── admin/             # Admin portal pages
│   │   │   └── employee/          # Employee portal pages
│   │   ├── components/            # Reusable React components
│   │   ├── context/               # React Context (Auth)
│   │   ├── lib/                   # Utility functions & API
│   │   └── types/                 # TypeScript type definitions
│   ├── public/                    # Static assets
│   ├── .env.local                 # Environment variables (not in git)
│   ├── next.config.ts             # Next.js configuration
│   ├── tailwind.config.ts         # Tailwind CSS configuration
│   └── package.json               # Dependencies
── README.md                      # Project overview
├── QUICKSTART.md                  # 1-minute setup guide
└── SUPABASE_SETUP.sql            # Database schema
```

---

##  Environment Setup

### Prerequisites
- Node.js 18+ (recommended: 20+)
- npm 9+ or yarn 1.22+
- Supabase account
- Git

### Step-by-Step Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd customer-tracking-system
   ```

2. **Setup Supabase**
   - Create new project at [supabase.com](https://supabase.com)
   - Run `frontend/SUPABASE_SETUP.sql` in SQL Editor
   - Copy Project URL and anon key from Settings → API

3. **Configure Environment**
   ```bash
   cd frontend
   cp .env.local.example .env.local
   ```
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Authentication Flow

### Role-Based Access Control

The app uses a custom authentication context (`AuthContext.tsx`) that:
1. Stores user session in localStorage
2. Validates credentials against Supabase `staff` table
3. Provides role-based routing
4. Handles logout and session cleanup

### User Roles

| Role | Access Level | Key Features |
|------|--------------|--------------|
| `admin` | Full system | Employee management, analytics, all data |
| `receptionist` | Customer-facing | Ticket generation, final checkout |
| `section_manager` | Section-specific | Check-in/out, transfers, sales |

### Authentication Endpoints

```typescript
// Admin login
authApi.adminLogin(username, password)

// Employee login (receptionist + section managers)
authApi.employeeLogin(username, password)

// Generic login (deprecated, use specific endpoints)
authApi.login(username, password)
```

---

## 🗄️ Database Schema

### Core Tables

#### `staff`
Employee accounts with role and section assignment.
- `username`: Unique identifier
- `password_hash`: Plain text for demo (use bcrypt in production)
- `role`: admin | receptionist | section_manager
- `assigned_section`: reception | gold | silver | diamond | platinum

#### `customers`
Customer profiles with visit tracking.
- Auto-increments `visit_count` on updates
- Tracks `first_visit` and `last_visit` timestamps
- VIP status: `visit_count > 2`

#### `tickets`
Active/completed customer tickets.
- `ticket_number`: Unique identifier (auto-generated)
- `target_section`: Assigned section
- `current_section`: Real-time location
- `status`: ACTIVE | COMPLETED | CLOSED | CANCELLED

#### `movements`
Section transition records.
- Tracks `from_section` and `to_section`
- Records `time_spent_seconds` in previous section
- Links to `ticket_id` and `customer_id`

#### `section_time_logs`
Detailed time tracking per section.
- `entry_time`: When customer entered
- `exit_time`: When customer left (null if still in section)
- `duration_seconds`: Calculated time spent

#### `sales`
Transaction records.
- Links to `ticket_id` and `customer_id`
- Tracks payment method and amounts
- Generates `invoice_number`

#### `invoices`
Generated invoice records.
- JSON `invoice_data` for flexible storage
- Status tracking: generated | printed | sent | cancelled

---

## 🔄 Customer Journey Flow

```
┌─────────────┐
│  Reception  │
│  (Login)    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Generate Ticket │
│ - Customer Info │
│ - Auto-assign   │
│   Section       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  QR Code Scan   │◄── Customer shows QR
──────┬──────────┘
       │
       ▼
┌─────────────────
│ Section Manager │
│ (Check-in)      │
└──────┬──────────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐ ┌────────────┐
│  Transfer   │ │   Check    │
│  to Next    │ │    Out     │
│  Section    │ └─────┬──────┘
└─────────────┘       │
                      ▼
               ┌──────────────┐
               │ Buying?      │
               │ → Sales Page │
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │  Generate    │
               │  Invoice     │
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │  Reception   │
               │  (Final      │
               │   Checkout)  │
               └──────────────┘
```

---

## 🔑 Key Features Implementation

### Smart Section Assignment
```typescript
function autoAssignSection(gender: string, age: string): string {
  const ageNum = parseInt(age);
  if (gender === "Female" && ageNum < 30) return "diamond";
  if (gender === "Female" && ageNum >= 30) return "gold";
  if (gender === "Male" && ageNum < 25) return "silver";
  if (gender === "Male" && ageNum >= 25 && ageNum < 40) return "gold";
  if (gender === "Male" && ageNum >= 40) return "platinum";
  return "gold";
}
```

### VIP Recognition
```typescript
const isVIP = customer.visit_count > 2;
// Shows crown icon and "VIP" badge in UI
```

### Duplicate Ticket Prevention
```typescript
const activeTickets = await ticketsApi.list("ACTIVE");
const hasActive = activeTickets.some(
  (t) => t.customer_id === existingCustomer.id
);
if (hasActive) {
  setError("Customer already has an active ticket");
  return;
}
```

### Time Tracking
```typescript
// On check-in
await sectionTimeApi.create({
  ticket_id: ticket.id,
  section: mySection,
  entry_time: now.toISOString(),
  exit_time: null,
  duration_seconds: 0,
});

// On check-out
const duration = Math.floor(
  (now.getTime() - entryTime) / 1000
);
await sectionTimeApi.update(logId, {
  exit_time: now.toISOString(),
  duration_seconds: duration,
});
```

---

## 🎨 UI/UX Features

### Animations
- **Page transitions**: Fade-in effect
- **Modal animations**: Scale-in effect
- **Toast notifications**: Slide-in from right
- **Loading states**: Skeleton screens

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Collapsible sidebar on mobile

### Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- High contrast colors

---

## 🧪 Testing

### Manual Testing Checklist

#### Authentication
- [ ] Admin can login and access all pages
- [ ] Receptionist can login and see only ticket/invoice pages
- [ ] Section manager sees only their section
- [ ] Invalid credentials show error message
- [ ] Logout clears session

#### Ticket Generation
- [ ] Phone validation (10 digits, starts with 6-9)
- [ ] Age validation (1-120)
- [ ] Auto-section assignment works
- [ ] VIP badge shows for repeat customers
- [ ] Duplicate ticket prevention works

#### Section Management
- [ ] Check-in updates current_section
- [ ] Time log created on check-in
- [ ] Check-out closes time log
- [ ] Transfer moves customer to new section
- [ ] Sales page validates section match

#### Admin Features
- [ ] Dashboard shows live metrics
- [ ] Employee management works
- [ ] All tickets viewable
- [ ] Analytics charts render

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Set root directory: `frontend`

3. **Configure Environment**
   Add these in Vercel settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Access your live URL

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```

---

## 🔒 Security Best Practices

### Current Implementation (Demo)
- Plain text passwords in database
- Permissive RLS policies
- No rate limiting
- HTTP connections allowed

### Production Recommendations

1. **Password Hashing**
   ```typescript
   // Use bcrypt or argon2
   import bcrypt from 'bcryptjs';
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

2. **Row Level Security**
   ```sql
   -- Example: Only allow section managers to see their section
   CREATE POLICY "Section managers see own section"
   ON tickets FOR SELECT
   USING (
     auth.uid() IN (
       SELECT id FROM staff
       WHERE role = 'section_manager'
       AND assigned_section = tickets.target_section
     )
   );
   ```

3. **Rate Limiting**
   - Implement at API route level
   - Use Redis or similar for tracking

4. **HTTPS Only**
   - Force HTTPS in Next.js config
   - Use HSTS headers

5. **Input Sanitization**
   - Validate all user inputs
   - Use parameterized queries (Supabase does this)

---

##  API Reference

### Auth API
```typescript
authApi.adminLogin(username: string, password: string): Promise<UserInfo>
authApi.employeeLogin(username: string, password: string): Promise<UserInfo>
```

### Customers API
```typescript
customersApi.list(search?: string): Promise<Customer[]>
customersApi.byPhone(phone: string): Promise<Customer>
customersApi.create(data: CustomerData): Promise<Customer>
customersApi.update(id: string, data: Partial<CustomerData>): Promise<Customer>
```

### Tickets API
```typescript
ticketsApi.list(status?: string): Promise<Ticket[]>
ticketsApi.create(data: TicketData): Promise<Ticket>
ticketsApi.update(id: string, data: Partial<TicketData>): Promise<Ticket>
ticketsApi.close(id: string): Promise<Ticket>
ticketsApi.movements(ticketId: string): Promise<Movement[]>
```

### Section Time API
```typescript
sectionTimeApi.create(data: TimeLogData): Promise<TimeLog>
sectionTimeApi.update(id: string, data: Partial<TimeLogData>): Promise<TimeLog>
sectionTimeApi.byTicket(ticketId: string): Promise<TimeLog[]>
sectionTimeApi.byCustomer(customerId: string): Promise<TimeLog[]>
```

---

## 🐛 Debugging

### Common Issues

**"Invalid credentials" error**
- Check Supabase connection
- Verify staff table has data
- Check browser console for errors

**Section manager sees no customers**
- Verify `assigned_section` is set
- Check tickets have matching `target_section`
- Ensure tickets are ACTIVE status

**Time logs not creating**
- Check Supabase RLS policies
- Verify foreign key constraints
- Check browser console for errors

### Debug Tools

1. **Browser DevTools**
   - Console: Check for JavaScript errors
   - Network: Verify API calls
   - Application: Check localStorage

2. **Supabase Dashboard**
   - Table Editor: Verify data
   - SQL Editor: Run diagnostic queries
   - Logs: Check for errors

3. **Next.js DevTools**
   - React DevTools: Component tree
   - Performance: Render timing

---

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is for educational/demo purposes.

---

**Happy Coding!**
