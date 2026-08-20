<div align="center">

<img src="https://img.shields.io/badge/CityPulse_AI-Urban_Digital_Immune_System-16a34a?style=for-the-badge&logo=leaflet&logoColor=white" />

# CityPulse AI
### The City That Fixes Itself

**🌐 Live Demo: [citypulse-ai-ten.vercel.app](https://citypulse-ai-ten.vercel.app)**

**An end-to-end AI-powered civic issue management platform for Ahmedabad Municipal Corporation.**  
Citizens report. AI analyzes. Workers fix. Admins track everything — in real time.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.9+-3776ab?style=flat-square&logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06b6d4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## What It Does

CityPulse AI is a full-stack smart city platform that turns citizen complaints into auto-analyzed, prioritized, assigned, and AI-verified work orders. Every piece of data inserted — issues, assignments, resolutions — is stored in CSV files, flows through the AI pipeline, and surfaces correctly across all three roles.

```
Citizen reports issue (photo + GPS + voice)
    ↓
YOLOv8 road damage detection + Gemini 1.5 Flash scene analysis
    ↓
6-factor risk engine → P1/P2/P3/P4 priority
    ↓
Admin assigns to worker → SLA timer starts → notification sent
    ↓
Worker resolves → uploads after-photo
    ↓
DINOv2 visual similarity + Gemini verification → issue closed
    ↓
Citizen gets notified → data updates across all dashboards
```

---

## Screenshots

| Role | Page | Description |
|------|------|-------------|
| Admin | City Overview | Real-time KPIs, 4-mode map (pins/hotspots/density/risk heat), ward health table, critical feed with live assign |
| Admin | Issues | Paginated table, search, bulk assign, status change, CSV export |
| Admin | Analytics | 8 charts — all live from CSV (weekly trend, dept SLA, priority distribution, radar, resolution rates) |
| Admin | Hotspots | AI-detected clusters with pulse animation, prediction text, trend arrows |
| Admin | Workers | Leaderboard with performance scores, department SLA compliance |
| Worker | Dashboard | Priority queue with SLA countdown bars, map view, completed issues tab |
| Worker | Issue Detail | 4 tabs: overview, AI analysis, risk breakdown, timeline |
| Worker | Resolve | Before/after upload → real DINOv2 + Gemini AI verification |
| Citizen | Dashboard | Contribution score, recent issues, report CTA |
| Citizen | Report | 5-step wizard: photo → GPS → category → voice/description → AI preview |
| Citizen | Track | Live status pipeline with functional filter pills |

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| API Framework | **FastAPI** + Uvicorn (async, hot-reload) |
| AI Vision | **Google Gemini 1.5 Flash** — scene analysis, severity, recommended action |
| Object Detection | **YOLOv8** (Ultralytics) — road damage classification |
| Resolution Verification | **DINOv2** (Facebook) — visual similarity between before/after |
| Voice Transcription | **Whisper** — Hindi / English / Hinglish |
| Risk Engine | 6-factor deterministic scorer (severity, exposure, location, recurrence, weather, frequency) |
| Priority Model | XGBoost-backed priority prediction (P1–P4) |
| Storage | Thread-safe **CSV + pandas** — zero database setup |
| Auth | Cookie sessions + SHA-256 hashing |
| Notifications | In-memory + CSV-persisted notification system |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 14** (App Router) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS** + custom design system |
| Animations | **Framer Motion** |
| Maps | **Leaflet** + CARTO tiles |
| Heatmap | **Leaflet.heat** with dark-mode gradient |
| Charts | **Recharts** (Bar, Line, Area, Pie, Radar) |
| HTTP | **Axios** with session interceptor |
| Notifications | **react-hot-toast** |

---

## Project Structure

```
citypulse-ai/
├── backend/
│   ├── main.py                      # FastAPI app + CORS + routers
│   ├── requirements.txt
│   ├── .env                         # API keys (see setup)
│   ├── data/                        # CSV data store (auto-created)
│   │   ├── users.csv
│   │   ├── issues.csv               # All reported issues
│   │   ├── assignments.csv          # Worker assignments + SLA deadlines
│   │   ├── resolutions.csv          # Before/after resolution records
│   │   ├── ai_analyses.csv          # Gemini + YOLO results per issue
│   │   ├── risk_scores.csv          # 6-factor risk breakdown
│   │   ├── hotspots.csv             # AI-detected geographic clusters
│   │   ├── notifications.csv        # Role-based notification store
│   │   ├── wards.csv                # Ward metadata + health scores
│   │   ├── departments.csv          # Departments + SLA config
│   │   ├── issue_history.csv        # Full audit trail
│   │   └── voice_reports.csv        # Voice transcription records
│   ├── routers/
│   │   ├── auth.py                  # Login, register, session
│   │   ├── issues.py                # Create (full AI pipeline), list, get, update
│   │   ├── ai.py                    # Analyze, quick-analyze endpoints
│   │   ├── risk.py                  # Risk compute, leaderboard, recompute-all
│   │   ├── assignments.py           # Assign issue → officer, SLA calc, notify
│   │   ├── resolution.py            # Submit after-photo, AI verify, notify
│   │   ├── dashboard.py             # Summary, heatmap, analytics, hotspots
│   │   ├── workers.py               # Worker list, departments, performance
│   │   └── notifications.py        # CRUD, broadcast, mark-read
│   └── services/
│       ├── csv_store.py             # Thread-safe CSV read/write/upsert
│       ├── gemini_service.py        # Gemini scene analysis + verification
│       ├── yolo_service.py          # YOLOv8 road damage detection
│       ├── dinov2_service.py        # Visual similarity for resolution
│       ├── risk_engine.py           # 6-factor deterministic risk scorer
│       ├── priority_model.py        # XGBoost priority prediction
│       ├── hotspot_service.py       # Geo-cluster hotspot detection
│       ├── voice_service.py         # Whisper voice transcription
│       └── duplicate_detector.py   # DINOv2-based duplicate detection
│
└── frontend/
    ├── app/
    │   ├── page.tsx                 # Landing page
    │   ├── login/page.tsx
    │   ├── demo/page.tsx
    │   ├── admin/
    │   │   ├── dashboard/page.tsx   # City overview + maps + critical feed
    │   │   ├── issues/page.tsx      # All issues + bulk assign + export
    │   │   ├── analytics/page.tsx   # 8 charts, all live data, functional filters
    │   │   ├── hotspots/page.tsx    # Hotspot map + cards
    │   │   └── workers/page.tsx     # Worker leaderboard + dept breakdown
    │   ├── worker/
    │   │   ├── dashboard/page.tsx   # Priority queue + map + completed
    │   │   ├── issues/page.tsx      # Searchable issue queue
    │   │   ├── issues/[id]/page.tsx # 4-tab issue detail
    │   │   ├── resolve/[id]/page.tsx# AI verification flow
    │   │   └── resolved/page.tsx    # Resolution history
    │   └── citizen/
    │       ├── dashboard/page.tsx   # KPIs + contribution score
    │       ├── report/page.tsx      # 5-step report wizard
    │       └── track/page.tsx       # Issue tracker + status pipeline
    ├── components/
    │   ├── shared/
    │   │   ├── Navbar.tsx           # Notification bell, role dropdown, mobile menu
    │   │   └── Sidebar.tsx          # Role-aware sidebar with active state
    │   ├── maps/
    │   │   ├── IssueMap.tsx         # Priority-colored pins + CARTO tiles
    │   │   ├── HeatMap.tsx          # Leaflet.heat + dark tiles + legend overlay
    │   │   └── HotspotMap.tsx       # Pulsing clusters + CARTO tiles + popups
    │   ├── dashboard/
    │   │   ├── CityHealthScore.tsx  # Animated SVG arc gauge
    │   │   └── RiskBadge.tsx        # P1–P4 colored badge
    │   └── report/
    │       ├── ImageUpload.tsx
    │       ├── LocationPicker.tsx
    │       ├── CategorySelect.tsx
    │       └── AIPipeline.tsx
    ├── lib/
    │   ├── api.ts                   # All API calls (axios + interceptor)
    │   ├── auth.ts                  # Session helpers (localStorage)
    │   └── utils.ts                 # Color helpers, formatters, timeAgo
    └── types/index.ts               # All shared TypeScript types
```

---

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- A **Google Gemini API key** — [get one free](https://aistudio.google.com/app/apikey)

### 1 — Clone

```bash
git clone https://github.com/neevmodh/CityPulse_AI.git
cd CityPulse_AI
```

### 2 — Backend setup

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r citypulse-ai/backend/requirements.txt
```

Edit `citypulse-ai/backend/.env`:
```env
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-1.5-flash
DATA_DIR=./data
UPLOADS_DIR=./uploads
```

### 3 — Start the backend

```bash
cd citypulse-ai/backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- API: **http://localhost:8000**
- Interactive docs: **http://localhost:8000/docs**

### 4 — Frontend setup

```bash
cd citypulse-ai/frontend
npm install
npm run dev        # development
# or
npm run build && npm start   # production
```

- Frontend: **http://localhost:3000**

---

## Demo Accounts

All use password: **`demo123`**

| Role | Email | Access |
|------|-------|--------|
| **Citizen** | arjun@demo.com | Report issues, track status, contribution score |
| **Worker / Officer** | rajesh@demo.com | Priority queue, resolve with AI verification |
| **Admin** | admin@demo.com | Full city dashboard, assign, analytics, hotspots |

Or click **Try Demo** on the landing page — no login needed.

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CITIZEN                                   │
│  Report (photo + GPS + voice) → 5-step wizard                  │
└────────────────────────┬────────────────────────────────────────┘
                         │ POST /api/issues/
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AI PIPELINE                                  │
│  YOLOv8 road detection → Gemini scene analysis                  │
│  → 6-factor risk engine → P1/P2/P3/P4 priority                 │
│  → Stored: issues.csv + ai_analyses.csv + risk_scores.csv       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN                                     │
│  Sees issue in critical feed → assigns to worker + department   │
│  → Stored: assignments.csv                                       │
│  → Notification sent to worker                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        WORKER                                    │
│  Sees in queue → marks in_progress → goes to site               │
│  → Uploads after-photo → DINOv2 + Gemini verify                 │
│  → Stored: resolutions.csv                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    ▼         ▼
              VERIFIED     FAILED
              resolved  →  reopened
                    │
                    ▼
         Citizen gets notification
         Issue visible as resolved
         Analytics updated
```

---

## API Reference

Base URL: `http://localhost:8000/api`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login → returns token + user |
| POST | `/auth/register` | Register new account |
| GET | `/auth/me` | Current user info |
| POST | `/auth/logout` | Clear session |

### Issues
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/issues/` | Create issue (multipart: image + fields) — runs full AI pipeline |
| GET | `/issues/` | List with filters: status, category, ward, priority, officer_id |
| GET | `/issues/{id}` | Detail + AI analysis + history + resolution + voice |
| PATCH | `/issues/{id}/status` | Update status with history entry |
| GET | `/issues/citizen/{user_id}` | Citizen's own issues |
| GET | `/issues/worker/{worker_id}` | Worker's assigned issues |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/quick-analyze` | Fast preview (no storage) |
| POST | `/ai/analyze` | Full analysis with storage |
| GET | `/ai/analysis/{issue_id}` | Get stored analysis |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/admin` | Full admin dashboard data |
| GET | `/dashboard/summary` | Issue counts by status |
| GET | `/dashboard/analytics` | 8 data sets: weekly trend, dept resolution, priority counts, ward breakdown |
| GET | `/dashboard/heatmap` | Grid cells (kind=risk or complaints) |
| GET | `/dashboard/hotspots` | AI-detected hotspot clusters |
| GET | `/dashboard/health` | City health score + ward breakdown |

### Workers & Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workers/` | All workers with live issue stats |
| GET | `/workers/{id}` | Worker detail |
| GET | `/workers/departments/list` | Departments with counts + SLA |
| GET | `/workers/performance/summary` | Performance leaderboard |

### Assignments & Resolution
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/assignments/` | Assign issue to officer (fires notification) |
| GET | `/assignments/issue/{id}` | Assignments for an issue |
| GET | `/assignments/officer/{id}` | Assignments for a worker |
| POST | `/resolution/{issue_id}` | Submit after-photo → AI verify → resolve or reopen |
| GET | `/resolution/{issue_id}` | Get resolution record |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications/` | Get notifications (user_id or role) |
| POST | `/notifications/` | Create notification |
| PATCH | `/notifications/{id}/read` | Mark one read |
| PATCH | `/notifications/read-all` | Mark all read for user |

Full interactive docs at **http://localhost:8000/docs**

---

## Risk Engine

Each issue is scored across 6 independent factors:

| Factor | Max | How it's scored |
|--------|-----|----------------|
| Severity | 30 | critical=30, high=22, medium=14, low=6 |
| Traffic / Exposure | 20 | By category (electrical hazard=20, pothole=18…) |
| Location sensitivity | 20 | Base 8 + bonus for hospital/school/market nearby |
| Recurrence | 15 | Prior reports same ward+category × 4 (max 15) |
| Weather | 10 | Active rainfall warning = 8, else 2 |
| Frequency | 5 | Corroborating report count (capped at 5) |

Final score feeds an XGBoost model that outputs **P1 / P2 / P3 / P4** priority.

---

## Environment Variables

### Backend (`citypulse-ai/backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | Model name |
| `DATA_DIR` | No | `./data` | CSV storage path |
| `UPLOADS_DIR` | No | `./uploads` | Image upload path |
| `YOLO_WEIGHTS` | No | `./weights/yolov8_rdd.pt` | Custom YOLOv8 weights |
| `SECRET_KEY` | No | — | Session signing key |

### Frontend (`citypulse-ai/frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:8000` | Backend URL |
| `NEXT_PUBLIC_DEMO_MODE` | No | `true` | Enable demo bypass |

---

## Seed Data

Ships with 1000+ seeded issues across 10 Ahmedabad wards. To reseed:

```bash
cd citypulse-ai/backend
python seed_large.py
```

---

## Notes

- **CSV storage** — intentionally schema-free and portable. No database setup required. Thread-safe via `threading.Lock` in `csv_store.py`.
- **YOLO weights** — place `yolov8_rdd.pt` in `backend/weights/`. Without weights, falls back to Gemini-only classification.
- **Whisper** — optional. Voice notes fall back to typed description if not installed.
- **Python 3.9** — works with deprecation warnings from Google SDKs. Upgrade to 3.10+ to silence them.

---

## License

MIT © 2026 Neev Modi

---

<div align="center">
Built for <strong>Ahmedabad Municipal Corporation</strong> — Smart City Initiative
</div>
