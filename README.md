# 💎 Jewellery CRM & Customer Journey Tracker

<div align="center">

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Cache-Redis%207-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**A production-grade Customer Visit & Journey Management System purpose-built for jewellery showrooms.**
Track customers from entry to exit, monitor their movement across sections in real-time, handle billing & invoicing, and gain insights through rich analytics — all in one elegant platform.

[Features](#-features) • [Tech Stack](#%EF%B8%8F-tech-stack) • [Quick Start](#-quick-start) • [Screenshots](#-screenshots) • [Architecture](#-architecture) • [API Documentation](#-api-documentation) • [Roadmap](#%EF%B8%8F-roadmap)

</div>

---

## ✨ Features

### 🎫 Digital Ticketing
- **Auto-generated tickets** with unique numbers (`JR-2026-01001`)
- **QR codes** and **Code128 barcodes** rendered on every ticket (printable / scannable)
- Phone-based customer lookup → returning customers are auto-recognized and visit count is incremented
- Captures demographics: name, phone, gender, age, city, purpose, budget, remarks

### 🗺️ Customer Journey Tracking
- Real-time movement across showroom sections (Reception → Gold Ring → Diamond → Billing → Exit)
- **Automatic time-spent calculation** for every section (no manual timers needed)
- Reason & notes captured at every handoff
- Full chronological journey timeline viewable per ticket
- Floor Manager kanban view grouped by section

### 💰 Sales & Invoicing
- Complete purchase workflow at the billing counter
- Weight-based pricing with making charges, stone weight, GST, and discount
- Multi-payment support (Cash / UPI / Card / EMI)
- **Auto-generated invoice numbers** (`INV-2026-01001`)
- Invoice record snapshot for PDF regeneration

### 📊 Live Dashboard & Analytics
- WebSocket-ready live showroom overview (auto-refreshes every 15s)
- Key metrics: footfall today, active customers, revenue, conversion rate
- Section occupancy visualization (bars + pie chart)
- 7-day revenue chart
- Recent activity feed (ticket creations, movements, sales)
- Day-over-day visit trend

### 🔐 Role-Based Access Control
Five pre-seeded roles with fine-grained permissions:

| Role | Access |
|------|--------|
| **Receptionist** | Create customers & tickets, view sections |
| **Sales Executive** | Move customers, create sales |
| **Floor Manager** | Transfer customers, view analytics, close tickets |
| **Store Manager** | User management, reports, settings |
| **Admin** | Full system access, audit logs, roles |

JWT-based stateless authentication with bcrypt password hashing.

### 📈 Reporting
- Audit logging for every action (who did what, when)
- PDF / Excel / CSV exports (plug-in ready)
- Email reports via FastAPI-Mail

### 🏢 Multi-Store Ready
- Designed for multi-location showroom chains
- Store-specific sections, staff, tickets, and sales
- GST number, address, and branding per store

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 3, custom Gold jewellery theme |
| **UI Icons** | Lucide React |
| **Charts** | Recharts |
| **QR Codes** | qrcode.react (FE), qrcode[pil] + python-barcode (BE) |
| **Backend** | FastAPI 0.115+ (async), Python 3.12+ |
| **ORM** | SQLAlchemy 2.0 (async) |
| **Validation** | Pydantic v2 |
| **Database** | PostgreSQL 16 (production), SQLite (zero-setup dev) |
| **Cache / Realtime** | Redis 7 (pub/sub ready) |
| **Migrations** | Alembic |
| **Auth** | python-jose (JWT), passlib + bcrypt |
| **Reports** | openpyxl (Excel), reportlab (PDF) |
| **Email** | fastapi-mail |
| **Deployment** | Docker, docker-compose |

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required — includes Postgres & Redis)
- [Node.js 20+](https://nodejs.org/)
- [Python 3.12+](https://www.python.org/) (only needed for local dev without Docker)

### 🖱️ Option 1 — One-Click Start (Windows)

Double-click the batch files in the project root:

| File | Action |
|------|--------|
| `START-CRM.bat` | Starts Docker, backend, frontend, opens browser |
| `STOP-CRM.bat` | Stops everything cleanly |
| `RESET-CRM-DATA.bat` | Wipes the database for a fresh start |

That's it — the app opens at **http://localhost:3000** after ~45 seconds.

### 🐳 Option 2 — Docker (cross-platform)

```bash
# 1. Start backend + PostgreSQL + Redis
cd backend-fixed
docker compose up -d --build

# 2. Start frontend
cd ../frontend
npm install
npm run dev
```

Visit **http://localhost:3000**

### 💻 Option 3 — Local Dev (no Docker backend, uses SQLite)

```bash
# Backend (SQLite — zero database setup)
cd backend-fixed
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate.bat
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Default Credentials
```
Email:    admin@jewellerycrm.com
Password: Admin@2026!Secure
```
Demo mode is also enabled — any email/password combo auto-creates an admin account for instant testing.

---

## 📂 Project Structure

```
jewellery-crm/
├── START-CRM.bat              # One-click Windows launcher
├── STOP-CRM.bat               # One-click stopper
├── RESET-CRM-DATA.bat         # Data reset
├── docker-compose.dev.yml     # Standalone Postgres + Redis
│
├── backend-fixed/             # FastAPI backend
│   ├── app/
│   │   ├── api/v1/endpoints/  # Route handlers
│   │   │   ├── auth.py        # Login / logout / me
│   │   │   ├── users.py       # User CRUD (admin)
│   │   │   ├── customers.py   # Customer CRUD + search
│   │   │   ├── sections.py    # Showroom sections
│   │   │   ├── tickets.py     # Ticket creation + QR/barcode
│   │   │   ├── movements.py   # Section transfers
│   │   │   ├── sales.py       # Sales / billing
│   │   │   ├── invoices.py    # Invoice records
│   │   │   ├── analytics.py   # Dashboard metrics
│   │   │   └── audit_logs.py  # Audit trail
│   │   ├── core/              # Config, security, exceptions
│   │   ├── db/                # Engine, session, init, seed
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic v2 request/response models
│   │   ├── services/          # QR/barcode gen, audit helpers
│   │   └── main.py            # FastAPI app factory
│   ├── alembic/               # Database migrations
│   ├── docker-compose.yml     # Backend + Postgres + Redis
│   ├── Dockerfile
│   └── requirements.txt
│
└── frontend/                  # Next.js 15 frontend
    ├── src/
    │   ├── app/               # App Router pages
    │   │   ├── (auth)/login/  # Login page
    │   │   └── (dashboard)/   # Protected area
    │   │       ├── analytics/ # Live dashboard
    │   │       ├── reception/ # Ticket generation
    │   │       ├── floor/     # Section kanban + transfers
    │   │       ├── sales/     # Billing
    │   │       ├── tickets/   # Ticket table + timeline
    │   │       ├── customers/ # Customer directory
    │   │       ├── analytics-detail/ # Charts
    │   │       ├── manager/   # Reports hub
    │   │       └── admin/     # Admin panel
    │   ├── components/        # Reusable UI (MetricCard, etc.)
    │   ├── context/           # AuthContext (JWT)
    │   ├── lib/               # API client, utilities
    │   ├── services/          # (reserved)
    │   └── types/             # TypeScript types
    ├── tailwind.config.js
    ├── next.config.ts
    └── package.json
```

---

## 📸 Screenshots

> *Screenshots coming soon — see the walkthrough below for a live preview.*

**Login** — elegant gold-themed sign-in screen with demo-mode messaging.

**Dashboard** — 4 KPI cards (Visits / Active / Revenue / Conversion), live section occupancy bars, recent activity feed.

**Reception** — phone-lookup for returning customers, customer details form, interest tags → generates a beautifully designed ticket with embedded QR code.

**Floor Manager** — kanban-style columns per section; click any customer to open a transfer dialog with target section + reason.

**Sales & Billing** — search ticket by number, populate weight/making/GST/discount/payment method, auto-calculates final amount, creates invoice, closes ticket.

**Tickets** — filterable table (All / Active / Completed / Closed) with a full customer-journey timeline modal showing every section and time spent.

**Customers** — searchable visitor directory with visit-count badges and last-visit timestamps.

**Analytics** — 7-day revenue bar chart + section-occupancy pie chart powered by Recharts.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 15)                   │
│  Tailwind  •  ShadCN-style UI  •  Recharts  •  QR Renderer  │
└────────────────────────┬────────────────────────────────────┘
                         │  REST + JWT (http://localhost:8000/api/v1)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI, async)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │   Auth   │ │ Tickets  │ │ Movements│ │ Sales/Invoices │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────────┐ │
│  │ Customers│ │ Sections │ │ Analytics / Reports / Audit  │ │
│  └──────────┘ └──────────┘ └──────────────────────────────┘ │
│     JWT (python-jose)  •  Pydantic v2  •  QR/Barcode svcs  │
└──────────┬─────────────────────────────┬────────────────────┘
           │                             │
           ▼                             ▼
┌─────────────────────┐      ┌───────────────────────┐
│   PostgreSQL 16     │      │       Redis 7         │
│  (users, tickets,   │      │  cache • pub/sub •    │
│   sales, audit log) │      │  realtime updates     │
└─────────────────────┘      └───────────────────────┘
```

---

## 📖 API Documentation

Once the backend is running, interactive API docs are available at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health:** http://localhost:8000/health

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | JWT login (demo auto-provision) |
| GET | `/api/v1/auth/me` | Current user |
| POST | `/api/v1/tickets/` | Create ticket + QR + barcode |
| GET | `/api/v1/tickets/` | List tickets (filter by status) |
| GET | `/api/v1/tickets/{number}` | Get ticket with customer |
| GET | `/api/v1/tickets/{number}/movements` | Journey timeline |
| POST | `/api/v1/movements/` | Record a section transfer |
| POST | `/api/v1/sales/` | Complete sale + create invoice |
| GET | `/api/v1/sales/` | List sales |
| GET | `/api/v1/customers/` | Search customers |
| GET | `/api/v1/sections/` | List sections |
| GET | `/api/v1/analytics/dashboard` | Live dashboard data |
| GET | `/api/v1/invoices/` | List invoices |
| GET | `/api/v1/audit-logs/` | Audit trail |

---

## 🔧 Environment Variables

Copy `backend-fixed/.env.example` to `backend-fixed/.env` and `frontend/.env.local.example` to `frontend/.env.local`:

**Backend (`backend-fixed/.env`):**
```env
DEBUG=false
ALLOWED_ORIGINS=http://localhost:3000
DATABASE_URL=postgresql+asyncpg://jewellery_admin:jewellery_secure_2026@postgres:5432/jewellery_crm
REDIS_URL=redis://redis:6379/0
JWT_SECRET_KEY=change-me-to-a-long-random-string
FIRST_ADMIN_EMAIL=admin@jewellerycrm.com
FIRST_ADMIN_PASSWORD=Admin@2026!Secure
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🛣️ Roadmap

- [x] Core CRUD (customers, tickets, movements, sales, invoices)
- [x] JWT auth & RBAC with 5 roles
- [x] QR code & barcode generation on tickets
- [x] Auto time-spent tracking across sections
- [x] Live dashboard with metrics & charts
- [x] Audit logging
- [x] Docker Compose (backend + DB + Redis)
- [x] One-click Windows launcher
- [x] Multi-dialect UUID (works with SQLite & Postgres)
- [ ] **WebSocket** real-time updates (no polling needed)
- [ ] **PDF invoice generation** with store logo & GST breakdown
- [ ] **Excel / PDF report exports** on the Manager page
- [ ] **Email receipts** via FastAPI-Mail
- [ ] **QR scanner** (tablet-based section transfers)
- [ ] **Product catalog** master & per-product sale line items
- [ ] **Staff performance** leaderboard
- [ ] **Thermal printer integration** (80mm receipts)
- [ ] WhatsApp notifications for customers
- [ ] Multi-store switching in UI

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is available under the MIT License. See `LICENSE` for details.

---

## 🙋 Support

If you run into issues, check:
1. Docker Desktop is running
2. Ports 3000, 8000, 5432, 6379 are free
3. Backend logs: `docker compose logs backend --tail=100`
4. You've waited long enough (~30-45s on first launch for Postgres to initialize)

<div align="center">
<br />
<p>Built with 💛 for jewellery retailers.</p>
<p>
<img src="https://img.shields.io/badge/Made%20with-FastAPI%20%26%20Next.js-gold?style=for-the-badge" alt="Made with FastAPI & Next.js"/>
</p>
</div>
