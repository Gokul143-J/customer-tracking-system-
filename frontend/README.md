# Jewellery CRM — Frontend

Next.js 15 + TypeScript + TailwindCSS frontend for the Jewellery CRM & Customer Journey Tracker.

## Stack
- **Next.js 15** (App Router)
- **TypeScript 5**
- **TailwindCSS 3**
- **Lucide React** (icons)
- **Recharts** (analytics charts)
- **qrcode.react** (client-side QR rendering for the ticket screen)
- **js-cookie** (utilities)

API calls are made to the FastAPI backend (`http://localhost:8000` by default) via a thin wrapper in `src/lib/api.ts`. A rewrite rule in `next.config.ts` proxies `/api/v1/*` to the backend so you can also call relative URLs.

## Getting Started

### 1. Install
```bash
cd frontend
npm install
```

### 2. Configure
```bash
cp .env.local.example .env.local
# Edit .env.local if your backend runs on a different host/port
```

### 3. Run
```bash
npm run dev
```
Open http://localhost:3000

## Pages / Roles

| Route               | Purpose                                                |
|---------------------|--------------------------------------------------------|
| `/login`            | JWT login page (auto-provisions admin in demo mode)    |
| `/analytics`        | Live dashboard (metrics, occupancy, recent activity)   |
| `/analytics-detail` | Charts: 7-day revenue, section occupancy pie           |
| `/reception`        | Visitor entry form → generates ticket with QR/barcode  |
| `/floor`            | Kanban-style per-section view + transfer dialog        |
| `/sales`            | Search by ticket → record sale → auto-create invoice   |
| `/tickets`          | Tickets table with status tabs + journey timeline modal|
| `/customers`        | Customer directory with search & visit badges          |
| `/manager`          | Reports hub (PDF / Excel / email — placeholders)       |
| `/admin`            | Admin panel cards (placeholders)                       |
| `/settings`         | Store/printer/theme settings (placeholders)            |

## Authentication

- On login, the JWT `access_token` and basic `user` info are stored in `localStorage`.
- Every API request via `src/lib/api.ts` automatically attaches `Authorization: Bearer <token>`.
- The dashboard layout (`src/app/(dashboard)/layout.tsx`) redirects to `/login` if unauthenticated.
- Logout clears local storage and hits `POST /api/v1/auth/logout`.

## Connecting to the Backend

The frontend expects the fixed backend at `/home/user/backend-fixed` to be running:
```bash
cd backend-fixed
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Default credentials:
```
admin@jewellerycrm.com / Admin@2026!Secure
```
Or use any email — the backend demo-mode will auto-provision an admin.
