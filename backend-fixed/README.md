# Jewellery CRM — Fixed & Completed Backend

A production-grade FastAPI backend for the **Jewellery CRM & Customer Journey Tracker** (Customer Visit Management System for jewellery showrooms). This is a completed/improved version of the backend already present at
[GurusharanS0906/Customer-visit-management-system](https://github.com/GurusharanS0906/Customer-visit-management-system).

It fixes several bugs in the original code and adds missing endpoints/auth/services.

---

## 🧰 Languages & Technologies Used

| Layer            | Technology                                                |
|------------------|-----------------------------------------------------------|
| Language         | **Python 3.12+**                                          |
| Web Framework    | **FastAPI** (async)                                       |
| ASGI Server      | Uvicorn                                                   |
| ORM              | **SQLAlchemy 2.0 (async)**                                |
| Validation       | **Pydantic v2**                                           |
| Database         | **PostgreSQL 16** (via `asyncpg`, `psycopg2-binary` for migrations) |
| Migrations       | Alembic                                                   |
| Auth             | JWT (`python-jose`), bcrypt (`passlib`)                   |
| Cache / Realtime | Redis 7 (configured, ready for WebSocket pub/sub)         |
| QR / Barcodes    | `qrcode[pil]`, `python-barcode`, Pillow                   |
| Reports          | openpyxl (Excel), reportlab (PDF)                         |
| Email            | fastapi-mail                                              |
| HTTP Client      | httpx                                                     |
| Containers       | Docker, docker-compose                                     |

> The frontend (not provided here) is **Next.js 15 + TypeScript + Tailwind + ShadCN UI + Framer Motion** per the upstream README.

The GitHub language breakdown for the repo is **~98.7% Python** with the remaining being config/Docker/YAML.

---

## 🔧 What was fixed / added vs. the original backend

The original repo's backend was a solid scaffolding but had a few functional bugs and missing pieces. This version:

1. **Fixes the `datetime.utcnow()` deprecation** — all timestamps now use timezone-aware `datetime.now(timezone.utc)`.
2. **Fixes the ticket creation bug** where it used `hashed_password` (non-existent field on `User`) instead of `password_hash`.
3. **Adds proper JWT authentication** in `app/api/deps.py` (`get_current_user`, `require_permission(resource, action)`, OAuth2PasswordBearer).
4. **Adds missing endpoints**:
   - `/auth/me`, `/auth/logout`, `/auth/login/oauth` (OAuth2 password flow for Swagger).
   - `/users/...` CRUD (admin only with RBAC).
   - `/customers/...` CRUD + search by phone.
   - `/sections/...` list/create/update scoped by store.
   - `POST /tickets/{id}/close` to close a ticket without a sale.
   - `/sales/...` list + get by id.
   - `/invoices/...` patch, get-by-number, list with sale relation.
5. **Adds QR code + Barcode generation service** (`app/services/ticket_service.py`) — every new ticket gets a QR and Code128 barcode embedded as base64 PNGs.
6. **Adds audit-log helper** (`app/services/audit_service.py`) and wires login, logout, ticket creation, movement and sale creation into it.
7. **Adds missing schemas** for `auth` and `user`; fixes schema exports.
8. **Fixes ticket numbering** to be zero-padded and collision-safe.
9. **Adds movement time-spent calculation using timezone-aware datetimes** (the original used naive datetimes causing errors on timezone-aware columns).
10. **Adds psycopg2-binary dependency** (required by Alembic's sync engine — `sync_database_url` referenced psycopg2 but it wasn't in `pyproject.toml`).
11. **Adds Pillow dependency** (required by `qrcode[pil]` image generation).
12. **Creates an initial "entry → reception" movement** on ticket creation and a final "billing" movement on sale / "exit" movement on close, so the customer journey timeline is always complete.
13. **Sales endpoint now also creates an Invoice row** (matching the original schema design) so `/invoices` returns data immediately.
14. **Analytics improved**: today's visits w/ trend vs. yesterday, revenue today, conversion rate, section occupancy, recent activity.
15. **CORS order fixed** — middleware added *before* router is included (order matters in Starlette).
16. **Demo login auto-provisioning kept** but corrected (uses `password_hash`), and existing users must now provide the real password (safer default).

---

## 📁 Project Structure

```
backend-fixed/
├── app/
│   ├── api/
│   │   ├── deps.py                 # DB session + JWT auth + RBAC
│   │   └── v1/
│   │       ├── router.py
│   │       └── endpoints/
│   │           ├── auth.py
│   │           ├── users.py
│   │           ├── customers.py
│   │           ├── sections.py
│   │           ├── tickets.py
│   │           ├── movements.py
│   │           ├── sales.py
│   │           ├── invoices.py
│   │           ├── analytics.py
│   │           └── audit_logs.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── exceptions.py
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── init_db.py
│   ├── models/                     # SQLAlchemy models (unchanged from upstream)
│   │   ├── user.py, role.py, store.py
│   │   ├── customer.py, ticket.py, section.py, movement.py
│   │   ├── sale.py, invoice.py, product.py
│   │   ├── notification.py, audit_log.py, setting.py
│   ├── schemas/                    # Pydantic v2 schemas
│   │   ├── auth.py, user.py
│   │   ├── customer.py, ticket.py, movement.py
│   │   ├── sale.py, invoice.py
│   │   ├── audit_log.py, analytics.py
│   └── services/
│       ├── ticket_service.py       # QR + barcode generator
│       └── audit_service.py        # Audit log writer
├── alembic/                        # Migrations
├── alembic.ini
├── pyproject.toml
├── Dockerfile
├── .env.example
└── README.md
```

---

## 🚀 How to Run

### 1. Prerequisites
- Python 3.12+
- PostgreSQL 16 running (or use the repo's `docker-compose.dev.yml`)
- Redis 7 (optional for caching/WS; app boots without it)

### 2. Start the DB (from the repo root)
```bash
docker compose -f docker-compose.dev.yml up -d
```

### 3. Install & run backend
```bash
cd backend-fixed
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env            # edit as needed
alembic upgrade head            # apply migrations (or rely on create_all on startup)
uvicorn app.main:app --reload --port 8000
```

### 4. Access
- API docs (Swagger UI): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/health

Default seeded admin (see `.env`):
```
Email:    admin@jewellerycrm.com
Password: Admin@2026!Secure
```

Or hit `POST /api/v1/auth/login` with **any** email/password in demo mode — a new admin user will be auto-created for that email on first login.

---

## 🔌 Key API Endpoints

| Method | Path                                         | Purpose                                  |
|--------|----------------------------------------------|------------------------------------------|
| POST   | `/api/v1/auth/login`                         | Login, get JWT                           |
| GET    | `/api/v1/auth/me`                            | Current user profile                     |
| POST   | `/api/v1/auth/logout`                        | Logout (stateless, audit entry)          |
| GET    | `/api/v1/users/`                             | List users (admin)                       |
| POST   | `/api/v1/users/`                             | Create user (admin)                      |
| GET    | `/api/v1/customers/`                         | List/search customers                    |
| POST   | `/api/v1/customers/`                         | Create customer                          |
| GET    | `/api/v1/customers/by-phone/{phone}`         | Lookup by phone                          |
| GET    | `/api/v1/sections/`                          | List sections (store-scoped)             |
| POST   | `/api/v1/tickets/`                           | Create ticket + QR/barcode + first move  |
| GET    | `/api/v1/tickets/`                           | List tickets (optional `?status=`)       |
| GET    | `/api/v1/tickets/{number_or_id}`             | Get ticket w/ customer + movements       |
| GET    | `/api/v1/tickets/{id}/movements`             | Movement timeline                        |
| POST   | `/api/v1/tickets/{id}/close`                 | Close ticket (no purchase)               |
| POST   | `/api/v1/movements/`                         | Record a section transfer                |
| POST   | `/api/v1/sales/`                             | Record sale, close ticket, create invoice|
| GET    | `/api/v1/sales/`                             | List sales                               |
| GET    | `/api/v1/invoices/`                          | List invoices                            |
| GET    | `/api/v1/invoices/by-number/{number}`        | Get invoice by number                    |
| GET    | `/api/v1/analytics/dashboard`                | Live dashboard metrics                   |
| GET    | `/api/v1/audit-logs/`                        | Audit trail                              |

---

## 🔐 Auth & RBAC

All protected endpoints use `Depends(get_current_user)` which reads a `Bearer <JWT>` from the `Authorization` header. The JWT includes `role_id` and `store_id` claims. `require_permission(resource, action)` checks the role's JSON permission matrix (e.g. `require_permission("tickets", "create")`) matching the permissions seeded in `db/init_db.py` for:

- `admin`
- `store_manager`
- `floor_manager`
- `sales_executive`
- `receptionist`

---

## 🧪 Quick smoke test (curl)

```bash
# Login (demo: auto-provisions admin if email is new)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jewellerycrm.com","password":"Admin@2026!Secure"}'

# Create a ticket (replace $TOKEN with the access_token from above)
curl -X POST http://localhost:8000/api/v1/tickets/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {"name":"John Doe","phone":"+919876543210","gender":"Male","city":"Mumbai","purpose":"Wedding","budget":"50k-1L"},
    "ticket": {"interested_products":["gold_ring","diamond"],"current_section":"reception"}
  }'

# Dashboard
curl http://localhost:8000/api/v1/analytics/dashboard -H "Authorization: Bearer $TOKEN"
```
