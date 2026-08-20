<div align="center">

```
 ██████╗██╗████████╗██╗   ██╗██████╗ ██╗   ██╗██╗     ███████╗███████╗     █████╗ ██╗
██╔════╝██║╚══██╔══╝╚██╗ ██╔╝██╔══██╗██║   ██║██║     ██╔════╝██╔════╝    ██╔══██╗██║
██║     ██║   ██║    ╚████╔╝ ██████╔╝██║   ██║██║     ███████╗█████╗      ███████║██║
██║     ██║   ██║     ╚██╔╝  ██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝      ██╔══██║██║
╚██████╗██║   ██║      ██║   ██║     ╚██████╔╝███████╗███████║███████╗    ██║  ██║██║
 ╚═════╝╚═╝   ╚═╝      ╚═╝   ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝    ╚═╝  ╚═╝╚═╝
```

### **The City That Fixes Itself**

*An end-to-end AI-powered civic issue management platform for Ahmedabad Municipal Corporation*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.9+-3776ab?style=flat-square&logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06b6d4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00FFFF?style=flat-square)](https://ultralytics.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**🌐 Live:** [citypulse-ai-ten.vercel.app](https://citypulse-ai-ten.vercel.app) &nbsp;·&nbsp; **📦 Repo:** [github.com/neevmodh/CityPulse_AI](https://github.com/neevmodh/CityPulse_AI)

</div>

---

## Overview

CityPulse AI is a production-grade smart city platform that transforms citizen civic complaints into structured, AI-analyzed, priority-ranked, assigned, and AI-verified municipal work orders — with real-time dashboards, live maps, heatmaps, hotspot clustering, and a complete three-role workflow for Citizens, Field Officers, and Administrators.

Every piece of data — issues, assignments, resolutions, AI analyses, risk scores, notifications — is stored in CSV files (zero database), flows through a multi-model AI pipeline, and surfaces correctly and in real time across all three roles.

---

## Table of Contents

1. [AI Pipeline](#ai-pipeline)
2. [AI Models](#ai-models)
3. [Risk Engine](#risk-engine)
4. [Data Architecture](#data-architecture)
5. [Features by Role](#features-by-role)
6. [Tech Stack](#tech-stack)
7. [Project Structure](#project-structure)
8. [API Reference](#api-reference)
9. [Data Flow](#data-flow)
10. [Quick Start](#quick-start)
11. [Demo Accounts](#demo-accounts)
12. [Environment Variables](#environment-variables)

---

## AI Pipeline

Every issue submitted by a citizen runs through a **6-step automated pipeline** before any human sees it:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ISSUE CREATION PIPELINE                              │
│                                                                               │
│  STEP 1        STEP 2         STEP 3          STEP 4       STEP 5   STEP 6  │
│                                                                               │
│  Photo    ─►  YOLOv8     ─►  Gemini     ─►   Risk     ─►  Store ─► History │
│  Upload       Road Damage    1.5 Flash        Engine        CSV     Entry   │
│               Detection      Scene            6-factor               +       │
│                              Analysis         Scoring        +      Status  │
│               ├─ class       ├─ category      ├─ P1–P4    DINOv2   Update  │
│               ├─ confidence  ├─ severity      ├─ score   Embedding          │
│               └─ bbox        ├─ description   └─ reasons  Saved             │
│                              ├─ risk_reason                                  │
│                              ├─ repair_days                                  │
│                              └─ action                                       │
│                                                                               │
│  PARALLEL: Voice note → Whisper transcription (Hindi/English/Hinglish)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Resolution Verification Pipeline** (when officer submits after-photo):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RESOLUTION VERIFICATION PIPELINE                       │
│                                                                               │
│  After Photo  ─►  DINOv2         ─►  Gemini         ─►  Combined Verdict   │
│  Uploaded         Visual              Before/After        (both must agree)  │
│                   Comparison         Comparison                              │
│                   ├─ 768-dim CLS     ├─ verified?         PASS: resolved ✓  │
│                   ├─ cosine sim      ├─ confidence        FAIL: reopened ✗  │
│                   └─ diff < 0.75     ├─ reason            + notification    │
│                      = repair made   └─ repair quality    to citizen        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Duplicate Detection Pipeline** (runs at issue creation):

```
New Issue ─► Location filter (100m radius, same category)
           ─► DINOv2 embedding similarity (threshold: 0.85)
           ─► Combined score: 40% location + 60% embedding ≥ 0.75 → duplicate
```

---

## AI Models

### 1. Google Gemini 2.5 Flash — Scene Analysis & Resolution Verification

**Role:** Primary vision intelligence for scene understanding and repair verification.

**Analysis prompt extracts:**
| Field | Description |
|-------|-------------|
| `category` | `pothole \| crack \| waterlogging \| garbage \| manhole \| streetlight \| tree \| footpath \| other` |
| `confidence` | 0.00–1.00 float |
| `severity` | `low \| medium \| high \| critical` |
| `description` | Detailed one-sentence scene description |
| `damage_extent` | Scale and physical scope of damage |
| `immediate_risk` | Safety hazard assessment |
| `recommended_action` | Specific repair action with time frame |
| `gemini_reasoning` | 2–3 sentence severity justification |
| `estimated_repair_days` | Integer estimate |
| `affected_population` | `individual \| neighborhood \| ward \| city` |

**Verification prompt compares before/after and returns:**
| Field | Description |
|-------|-------------|
| `verified` | Boolean — repair complete? |
| `confidence` | 0.00–1.00 |
| `reason` | One sentence explanation |
| `damage_still_present` | Boolean |
| `quality_of_repair` | `poor \| acceptable \| good \| excellent` |

**Fallback:** If Gemini is unavailable, a structured fallback dict is returned and the issue is flagged for manual review. No silent failures.

---

### 2. YOLOv8 — Road Damage Detection

**Model:** Custom-trained on the **Road Damage Dataset (RDD2022)** — `yolov8_rdd.pt`  
**Fallback:** `yolov8n.pt` (general detection) if RDD weights are absent  
**Confidence threshold:** 0.25

**Class mapping (RDD dataset → internal):**
| YOLO Class | Internal Label |
|-----------|----------------|
| `D00` | `longitudinal_crack` |
| `D10` | `transverse_crack` |
| `D20` | `alligator_crack` |
| `D40` | `pothole` |

**Output per detection:**
```json
{
  "detected": true,
  "primary_class": "pothole",
  "primary_confidence": 0.847,
  "all_detections": [
    { "class": "pothole", "confidence": 0.847, "bbox": [x1, y1, x2, y2] }
  ],
  "model": "yolov8_rdd"
}
```

**Category merge logic:** YOLO wins over Gemini when `detected=true` AND `primary_confidence > 0.4`. Otherwise Gemini category is used.

---

### 3. DINOv2 — Visual Embedding & Similarity

**Model:** `facebook/dinov2-base` (Vision Transformer, 768-dim CLS token)  
**Used for:** Duplicate detection + resolution verification

**Embedding flow:**
```
Image → AutoImageProcessor → DINOv2 ViT-B/14 → last_hidden_state[:, 0, :] → 768-dim float32 vector
```

**Duplicate detection:**
- Cosine similarity ≥ **0.92** → flagged as duplicate
- Combined score: `0.4 × location_score + 0.6 × embedding_score ≥ 0.75` → confirmed duplicate
- Embeddings cached as `.npy` files in `data/embeddings/`

**Resolution verification:**
- Before/after cosine similarity < **0.75** → visually different → repair likely made
- DINOv2 confidence: `1 - similarity` when resolved, `similarity` when failed

---

### 4. XGBoost — Priority Prediction Model

**Model:** `XGBRegressor` with synthetic training data (self-contained prototype)

**Training data (5 synthetic data points):**
```python
features = [severity, exposure, location, recurrence, weather, frequency]
# e.g. [30, 20, 20, 15, 10, 5] → score 96 (P1)
#      [6,  8,  8,  0,  2,  1] → score 22 (P4)
```

**Config:** `n_estimators=24, max_depth=2, learning_rate=0.08`  
**Fallback:** Deterministic sum of 6 factor scores if XGBoost unavailable

**Hard safety floors (override model output):**
- `manhole` near school/hospital/high-pedestrian zone → minimum score **82** (P1)
- `electrical_hazard` → minimum score **80** (P1)

**Priority labels:**
| Score | Label | Meaning |
|-------|-------|---------|
| ≥ 80 | P1 | Critical — immediate action |
| 60–79 | P2 | High — same day |
| 40–59 | P3 | Medium — within SLA |
| < 40 | P4 | Low — scheduled |

---

### 5. Whisper — Voice Transcription

**Model:** `openai/whisper-tiny` (configurable via `WHISPER_MODEL` env var)  
**Languages:** Hindi, English, Hinglish (auto-detect)  
**Fallback:** Typed description preserved verbatim if Whisper unavailable  
**Storage:** Transcript stored in `voice_reports.csv`

---

## Risk Engine

The risk engine is **fully deterministic and explainable** — every point awarded has a logged reason.

### 6-Factor Scoring (total: 0–100)

| Factor | Max Score | Logic |
|--------|-----------|-------|
| **Severity** | 30 | `critical=30, high=22, medium=14, low=6` — from Gemini severity |
| **Traffic / Exposure** | 20 | Category-based: `electrical_hazard=20, pothole=18, road_damage=16, manhole=16, sewage=16, crack=14, waterlogging=14, streetlight=12, footpath=10, garbage=10, tree=8, park_damage=6` |
| **Location Sensitivity** | 20 | Base 8 + bonuses: `hospital within 300m = +10, school within 200m = +8, market within 150m = +5, bus_stop within 100m = +4` |
| **Recurrence** | 15 | `prior_reports_same_ward_and_category × 4`, capped at 15 |
| **Weather** | 10 | Active rainfall warning = 8, dry = 2 |
| **Frequency** | 5 | Total corroborating report count, capped at 5 |

### Reasoning Trace Example
```
Severity 'high' → 22/30 | Category 'pothole' exposure → 18/20 |
+8: school nearby | +10: hospital nearby | Location sensitivity → 20/20 |
3 prior reports → 12/15 | Active rainfall warning → 8/10 |
4 total reports → 4/5 | xgboost-demo priority prediction → P1 (84.3)
```

All reasons are stored in `risk_scores.csv` per issue and surfaced in the frontend Risk Breakdown tab.

---

## Data Architecture

### Storage: Thread-Safe CSV + Pandas

No database. All data lives in `backend/data/*.csv`. Concurrent write safety via `threading.Lock`. All reads return typed pandas DataFrames; all writes are atomic.

### CSV Schema

| File | Key Columns | Records |
|------|-------------|---------|
| `issues.csv` | id, issue_code, reporter_id, category, description, image_path, latitude, longitude, ward_id, severity, risk_score, priority, status, assigned_to, department_id, created_at, updated_at | 1001 seeded |
| `users.csv` | id, name, email, password_hash, role, ward_id, department_id | 200 seeded |
| `ai_analyses.csv` | id, issue_id, model, category, confidence, severity, summary, reasoning, recommended_action | per issue |
| `risk_scores.csv` | id, issue_id, severity_score, exposure_score, location_score, recurrence_score, weather_score, frequency_score, final_score, priority, reasoning | per issue |
| `assignments.csv` | id, issue_id, department_id, officer_id, assigned_at, sla_deadline, status | per assignment |
| `resolutions.csv` | id, issue_id, officer_id, before_image, after_image, latitude, longitude, notes, started_at, completed_at, time_taken_hours, verification_status, verification_score, verification_reason, resolved_at | per resolution |
| `issue_history.csv` | id, issue_id, old_status, new_status, changed_by, notes, timestamp | full audit trail |
| `hotspots.csv` | id, ward, latitude, longitude, radius_meters, issue_count, dominant_category, avg_risk_score, severity, detected_at | auto-computed |
| `notifications.csv` | id, user_id, role, type, title, message, issue_id, read, created_at | per event |
| `voice_reports.csv` | id, issue_id, audio_path, transcript, transcript_language, translated_text, processing | per voice note |
| `wards.csv` | id, name, lat_center, lng_center, health_score, population, area_sqkm, councillor, total_issues, open_issues, resolved_issues | 10 wards |
| `departments.csv` | id, name, category, sla_hours, head, email, phone, active_workers | 8 departments |

### Issue Status State Machine

```
reported ──► ai_analyzed ──► verified ──► assigned ──► in_progress
                                                             │
                                                    ┌────────┴────────┐
                                                  PASS             FAIL
                                                    │                 │
                                                resolved ◄──── reopened ──► in_progress
                                                    │
                                                  closed
```

### Hotspot Detection Algorithm

```python
# Haversine clustering — O(n²) proximity scan
HOTSPOT_RADIUS_METERS = 300
MIN_ISSUES_FOR_HOTSPOT = 3

for each open issue:
    cluster = all open issues within 300m
    if len(cluster) >= 3:
        hotspot = {
            centroid: avg(lat, lon),
            avg_risk: mean(risk_scores),
            severity: critical if avg_risk≥85, high if ≥65, else medium,
            dominant_category: mode(categories)
        }
```

---

## Features by Role

### Citizen

| Feature | Description |
|---------|-------------|
| **5-Step Report Wizard** | Photo → GPS → Category → Voice/Description → AI Preview |
| **Instant AI Preview** | Quick-analyze before final submit — shows category, severity, risk score |
| **Voice Notes** | Record in Hindi/English/Hinglish, auto-transcribed by Whisper |
| **GPS Auto-detection** | Browser geolocation with ward auto-extraction |
| **AI Category Assist** | Gemini auto-selects category, user can override |
| **Live Issue Tracker** | Full 8-step pipeline visualization per issue |
| **Functional Filter Pills** | Filter by open/in_progress/resolved with live counts |
| **Resolution Evidence** | Before/after photo comparison when issue resolved |
| **Notifications** | Bell alerts when issue resolved, shows full AI verification result |
| **Contribution Score** | Gamified score: `resolved×12 + total×4` capped at 100 |
| **Duplicate Prevention** | DINOv2 + location check at submission |

### Worker / Field Officer

| Feature | Description |
|---------|-------------|
| **Priority Queue** | All assigned issues sorted by risk score desc |
| **SLA Countdown** | Live countdown bar per issue from `sla_deadline` field |
| **4-Tab Issue Detail** | Overview · AI Analysis · Risk Breakdown · Timeline |
| **Risk Breakdown** | Animated arc gauge + 6-factor bar breakdown with reasoning |
| **AI Analysis Tab** | Gemini reasoning, YOLO detections, confidence scores |
| **Status Timeline** | Full history of every status change with timestamps |
| **Map View** | All assigned issues plotted with priority-colored pins |
| **Resolution Upload** | Drag-and-drop after-photo with real AI verification |
| **DINOv2 + Gemini Verify** | Real visual comparison — not simulated |
| **Override with Note** | Supervisor override if AI fails, requires written explanation |
| **Completed Tab** | Full resolution history filtered to this worker only |
| **Performance Score** | Live `resolved / (resolved + active) × 100` |

### Admin

| Feature | Description |
|---------|-------------|
| **City Overview Dashboard** | KPIs + 4-mode map + ward table + critical feed |
| **Live KPIs** | Active issues, P1 critical count, resolved today, avg response days (computed from real timestamps) |
| **City Health Score** | Animated SVG arc gauge — avg of all ward health scores |
| **4-Mode Map** | Pins (priority-colored) · Hotspot clusters · Complaint density · Risk heat |
| **Critical Feed** | Live P1 issues with search, assign popover (workers+depts from API) |
| **Ward Health Table** | Health bars, open/resolved counts, trend arrows, per-ward inspect link |
| **Issues Management** | Full paginated table: search, filter by status/priority/category, per-row status change |
| **Bulk Assignment** | Select multiple issues → assign to officer + department in one action |
| **CSV Export** | One-click download of filtered issue list |
| **Analytics — 8 Charts** | All live from CSV: weekly trend (Area), category bar, status donut, dept SLA (horizontal bar), priority pie, ward volume, category radar, resolution rate bars |
| **Functional Filters** | Ward + category filters re-fetch backend with real data |
| **Hotspot Map** | Pulsing clusters with CARTO tiles, trend emoji, AI prediction text |
| **Worker Leaderboard** | Performance scores, resolved counts, avg resolution hours, dept SLA compliance |
| **Department Breakdown** | SLA compliance bar, resolve rate, open/resolved counts per dept |
| **Notifications** | Bell with unread count, mark-all-read, 30s auto-poll |
| **Auto-refresh** | Dashboard and critical feed refresh every 30 seconds |

---

## Tech Stack

### Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| API Framework | **FastAPI** | 0.111 | Async REST API, auto OpenAPI docs |
| ASGI Server | **Uvicorn** | 0.29 | Production ASGI with hot-reload |
| AI Vision | **Google Gemini** | 2.5 Flash | Scene analysis, verification |
| Object Detection | **YOLOv8** (Ultralytics) | 8.2 | Road damage classification, RDD weights |
| Visual Similarity | **DINOv2** (facebook/dinov2-base) | transformers 4.41 | 768-dim CLS embeddings, cosine similarity |
| Voice | **Whisper** (openai/whisper-tiny) | — | Multilingual transcription |
| Priority Model | **XGBoost** | 2.0.3 | XGBRegressor priority prediction |
| Data Processing | **Pandas** | 2.2 | CSV read/write/filter/sort |
| Numerical | **NumPy** | 1.26 | Embedding math, cosine similarity |
| Image Processing | **Pillow** | 10.3 | Image loading for DINOv2 |
| Auth | **bcrypt** | 4.1 | SHA-256 + bcrypt password hashing |
| Deep Learning | **PyTorch** | 2.3 | DINOv2 inference backend |
| Storage | **CSV + threading.Lock** | — | Thread-safe zero-DB persistence |
| Config | **python-dotenv** | 1.0 | Environment variable management |

### Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | **Next.js 14** | 14.2.3 | App Router, SSR, static generation |
| Language | **TypeScript** | 5.4 | Full type safety |
| Styling | **Tailwind CSS** | 3.4 | Utility-first, custom design system |
| Animations | **Framer Motion** | 11.2 | Page transitions, chart animations, map overlays |
| Maps | **Leaflet** | 1.9.4 | Interactive maps, custom markers |
| Map Tiles | **CARTO** | — | Light (pins/hotspots) and dark (heatmap) tiles |
| Heatmap | **Leaflet.heat** | 0.2 | Issue density and risk heatmap layers |
| Charts | **Recharts** | 2.12 | Bar, Line, Area, Pie, Radar charts |
| HTTP Client | **Axios** | 1.7 | API calls with session interceptor |
| Toast | **react-hot-toast** | 2.4 | Success/error notifications |
| File Upload | **react-dropzone** | 14.2 | Drag-and-drop image upload |
| UI Primitives | **Radix UI** | various | Accessible dialog, select, tabs, toast |
| Icons | **Lucide React** | 0.379 | Icon set |
| Dates | **date-fns** | 3.6 | Date formatting |
| Fonts | **Sora + Inter + JetBrains Mono** | — | Display, body, monospace |

### Data & Seed

| Item | Value |
|------|-------|
| Total seeded issues | **1,001** |
| Wards | **10** (Chandkheda, Maninagar, Satellite, Navrangpura, Gota, Bopal, Vatva GIDC, Vastral, Nikol, Naranpura) |
| Departments | **8** (Roads, Drainage, Sanitation, Lighting, Parks, Water, Emergency, Traffic) |
| Issue categories | **12** (pothole, crack, waterlogging, garbage, manhole, streetlight, fallen_tree, footpath, electrical_hazard, sewage, traffic_signal, park_damage) |
| Users | **200** (4 citizens + 3 workers + 1 admin + 192 demo citizens) |
| Priority distribution | ~27% P1, ~26% P2, ~23% P3, ~24% P4 |

---

## Project Structure

```
citypulse-ai/
├── backend/
│   ├── main.py                         # FastAPI app — CORS, mounts, router registration
│   ├── requirements.txt                # Full deps (with torch for local dev)
│   ├── Procfile                        # uvicorn start for Railway/Render
│   ├── runtime.txt                     # python-3.11
│   ├── .env                            # API keys (not committed)
│   ├── data/                           # CSV data store
│   │   ├── issues.csv                  # 1001 seeded issues
│   │   ├── users.csv                   # 200 seeded users
│   │   ├── ai_analyses.csv             # Gemini + YOLO results
│   │   ├── risk_scores.csv             # 6-factor risk breakdown per issue
│   │   ├── assignments.csv             # Officer assignments + SLA deadlines
│   │   ├── resolutions.csv             # Before/after + verification results
│   │   ├── issue_history.csv           # Full audit trail
│   │   ├── hotspots.csv                # AI-detected geo-clusters
│   │   ├── notifications.csv           # Role-based notification store
│   │   ├── voice_reports.csv           # Whisper transcription records
│   │   ├── wards.csv                   # 10 ward metadata + health scores
│   │   └── departments.csv             # 8 depts + SLA + contacts
│   ├── routers/
│   │   ├── auth.py                     # Login, register, session (SHA-256 + bcrypt)
│   │   ├── issues.py                   # Create (full 6-step AI pipeline), list, get, PATCH status
│   │   ├── ai.py                       # /analyze, /quick-analyze, /analysis/{id}
│   │   ├── risk.py                     # /compute, /score, /leaderboard, /recompute-all
│   │   ├── assignments.py              # Assign issue → officer, SLA calc, notifications
│   │   ├── resolution.py               # Submit after-photo → DINOv2 + Gemini verify
│   │   ├── dashboard.py                # summary, admin, analytics (real data), heatmap, hotspots
│   │   ├── workers.py                  # list, departments, performance leaderboard
│   │   └── notifications.py           # CRUD, broadcast, mark-read, mark-all-read
│   ├── services/
│   │   ├── csv_store.py                # Thread-safe CSV CRUD (threading.Lock)
│   │   ├── gemini_service.py           # Gemini 2.5 Flash analysis + verification
│   │   ├── yolo_service.py             # YOLOv8 RDD detection, class mapping
│   │   ├── dinov2_service.py           # facebook/dinov2-base, 768-dim CLS embeddings
│   │   ├── risk_engine.py              # 6-factor deterministic scorer + XGBoost
│   │   ├── priority_model.py           # XGBRegressor with synthetic training + fallback
│   │   ├── hotspot_service.py          # Haversine O(n²) proximity clustering
│   │   ├── voice_service.py            # Whisper transcription with demo fallback
│   │   └── duplicate_detector.py      # 40% location + 60% DINOv2 combined score
│   ├── weights/
│   │   └── yolov8_rdd.pt               # YOLOv8 RDD weights (place here manually)
│   ├── uploads/                        # Uploaded images + audio
│   └── seed_large.py                   # 1000-issue seeder
│
└── frontend/
    ├── app/
    │   ├── page.tsx                    # Landing page (animated cityscape SVG)
    │   ├── layout.tsx                  # Root layout — fonts, toaster
    │   ├── globals.css                 # Design system, animations, utility classes
    │   ├── login/page.tsx              # Login — citizen/worker/admin
    │   ├── demo/page.tsx               # No-auth demo bypass
    │   ├── admin/
    │   │   ├── dashboard/page.tsx      # City overview + maps + ward table + critical feed
    │   │   ├── issues/page.tsx         # All issues: search, filter, bulk assign, export
    │   │   ├── analytics/page.tsx      # 8 charts — all live, functional ward+category filters
    │   │   ├── hotspots/page.tsx       # Hotspot cards + map with pulse animation
    │   │   └── workers/page.tsx        # Worker leaderboard + dept SLA breakdown
    │   ├── worker/
    │   │   ├── dashboard/page.tsx      # Priority queue + SLA bars + map + completed
    │   │   ├── issues/page.tsx         # Searchable queue index
    │   │   ├── issues/[id]/page.tsx    # 4-tab detail: overview · AI · risk · timeline
    │   │   ├── resolve/[id]/page.tsx   # Real AI verification flow (DINOv2 + Gemini)
    │   │   └── resolved/page.tsx       # Worker's own resolution history + stats
    │   └── citizen/
    │       ├── dashboard/page.tsx      # KPIs + contribution score + recent issues
    │       ├── report/page.tsx         # 5-step wizard: photo → GPS → category → voice → AI preview
    │       └── track/page.tsx          # Issue tracker with functional filter pills
    ├── components/
    │   ├── shared/
    │   │   ├── Navbar.tsx              # Notification bell, user dropdown, mobile menu, 30s poll
    │   │   ├── Sidebar.tsx             # Role-aware sidebar with active state indicators
    │   │   ├── RoleGate.tsx            # Client-side role-based access control
    │   │   └── AnimatedCounter.tsx     # Animated number counter for landing stats
    │   ├── maps/
    │   │   ├── IssueMap.tsx            # Priority pins, CARTO light tiles, rich popups
    │   │   ├── HeatMap.tsx             # Leaflet.heat, dark CARTO tiles, legend overlay
    │   │   └── HotspotMap.tsx          # Pulsing circles, injected keyframe CSS, richer popups
    │   ├── dashboard/
    │   │   ├── CityHealthScore.tsx     # Animated SVG arc gauge (Framer Motion)
    │   │   ├── RiskBadge.tsx           # P1/P2/P3/P4 colored badge
    │   │   ├── StatusTimeline.tsx      # Full history timeline component
    │   │   └── KPICard.tsx             # Reusable KPI card
    │   └── report/
    │       ├── ImageUpload.tsx         # Drag-and-drop with preview
    │       ├── LocationPicker.tsx      # Leaflet map + geolocation
    │       ├── CategorySelect.tsx      # 12-category grid with AI pre-select
    │       ├── AIPipeline.tsx          # Animated pipeline visualization
    │       └── AIAnalysisDisplay.tsx   # Full Gemini result card
    ├── lib/
    │   ├── api.ts                      # All API calls: authApi, issuesApi, aiApi, riskApi,
    │   │                               # assignmentsApi, resolutionApi, dashboardApi,
    │   │                               # workersApi, notificationsApi
    │   ├── auth.ts                     # Session helpers (localStorage + cookie)
    │   └── utils.ts                    # getStatusColor, timeAgo, categoryLabel, imageUrl
    └── types/index.ts                  # Complete TypeScript types: Issue, User, Ward,
                                        # Department, Worker, Notification, HeatCell, etc.
```

---

## API Reference

Base URL: `http://localhost:8000/api` · Interactive docs: `http://localhost:8000/docs`

### Auth
| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| `POST` | `/auth/login` | `{email, password}` | `{token, user}` |
| `POST` | `/auth/register` | `{name, email, password, role?, ward_id?, department_id?}` | `{user_id}` |
| `GET` | `/auth/me` | — | `{user}` |
| `POST` | `/auth/logout` | — | `{message}` |

### Issues
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/issues/` | Create issue — multipart form (image + audio? + fields) → full AI pipeline |
| `GET` | `/issues/` | List with filters: `status, category, ward_id, priority, officer_id, limit, offset` |
| `GET` | `/issues/{id}` | Full detail: issue + analysis + history + risk + resolution + voice |
| `PATCH` | `/issues/{id}/status` | Update status — appends history entry |
| `GET` | `/issues/citizen/{user_id}` | Citizen's own issues |
| `GET` | `/issues/worker/{worker_id}` | Worker's assigned issues |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/analyze` | Full pipeline: YOLO + Gemini + risk + DINOv2 embedding, stores result |
| `POST` | `/ai/quick-analyze` | Fast preview: YOLO + Gemini, no storage, temp file cleaned up |
| `GET` | `/ai/analysis/{issue_id}` | Retrieve stored analysis |

### Risk
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/risk/compute/{issue_id}` | Recompute risk for an issue |
| `GET` | `/risk/score/{issue_id}` | Get stored risk score breakdown |
| `GET` | `/risk/leaderboard` | Top-N highest risk issues |
| `POST` | `/risk/recompute-all` | Batch recompute all issue risk scores |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/assignments/` | Assign issue → officer + department, computes SLA deadline, fires notification |
| `GET` | `/assignments/issue/{id}` | Assignments for an issue |
| `GET` | `/assignments/worker/{id}` | Assignments for a worker |
| `PATCH` | `/assignments/{id}` | Update assignment status |

### Resolution
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/resolution/{issue_id}` | Submit after-photo → DINOv2 visual compare + Gemini verify → resolve or reopen |
| `GET` | `/resolution/{issue_id}` | Get resolution record |

### Dashboard
| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| `GET` | `/dashboard/admin` | — | Full admin dashboard: KPIs, wards, hotspots, avg_response_days |
| `GET` | `/dashboard/summary` | `role, user_id` | Issue counts by status |
| `GET` | `/dashboard/analytics` | `ward_id, days, category` | 8 data sets: weekly_trend, dept_resolution, priority_counts, by_category, by_status, by_ward |
| `GET` | `/dashboard/heatmap` | `kind=risk\|complaints` | Grid cells with lat/lng/intensity |
| `GET` | `/dashboard/hotspots` | `refresh=true` | AI-detected clusters (re-cluster if refresh) |
| `GET` | `/dashboard/health` | — | City health score + all ward breakdowns |
| `GET` | `/dashboard/priority` | `officer_id, limit` | Priority-sorted issue queue |

### Workers & Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/workers/` | All workers with live issue stats (active/resolved/total) |
| `GET` | `/workers/{id}` | Worker detail with attached issues |
| `GET` | `/workers/departments/list` | All departments with counts + SLA + resolve rates |
| `GET` | `/workers/performance/summary` | Performance leaderboard sorted by resolved count |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notifications/` | Get notifications by `user_id` or `role`, optional `unread=true` |
| `POST` | `/notifications/` | Create notification |
| `PATCH` | `/notifications/{id}/read` | Mark one notification as read |
| `PATCH` | `/notifications/read-all` | Mark all notifications read for a user |

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          COMPLETE DATA FLOW                                   │
│                                                                                │
│  CITIZEN                                                                       │
│  ├─ Report wizard (photo + GPS + voice)                                       │
│  │   POST /api/issues/ (multipart)                                            │
│  │                                                                             │
│  │   ┌─ YOLOv8 road damage detection                                         │
│  │   ├─ Gemini 2.5 Flash scene analysis          ───► ai_analyses.csv        │
│  │   ├─ Whisper voice transcription              ───► voice_reports.csv      │
│  │   ├─ Risk engine (6 factors + XGBoost)        ───► risk_scores.csv        │
│  │   ├─ DINOv2 embedding saved                  ───► data/embeddings/        │
│  │   └─ Issue stored with AI results            ───► issues.csv              │
│  │       + history entry                        ───► issue_history.csv       │
│  │                                                                             │
│  └─ Track page shows live status pipeline                                     │
│                                                                                │
│  ADMIN                                                                         │
│  ├─ Sees issue in critical feed (P1/P2 only)                                 │
│  ├─ Opens assign popover (workers + depts from /api/workers/)                │
│  │   POST /api/assignments/                                                   │
│  │   ├─ SLA deadline computed: assigned_at + dept.sla_hours                 │
│  │   ├─ assignments.csv updated                                               │
│  │   ├─ issues.csv status → "assigned"                                       │
│  │   ├─ Personal notification → officer                                       │
│  │   └─ Broadcast notification → all admins                                  │
│  │                                                                             │
│  ├─ Analytics: 8 live charts from CSV                                        │
│  │   weekly_trend ← timestamps in issues.csv                                 │
│  │   dept_resolution ← resolutions.csv + departments.csv                     │
│  │   priority_counts ← issues.csv priority column                            │
│  │                                                                             │
│  └─ Hotspot map: re-cluster on demand                                        │
│      Haversine scan → 300m clusters → hotspots.csv                           │
│                                                                                │
│  WORKER                                                                        │
│  ├─ Queue shows assigned issues, sorted by risk_score desc                   │
│  ├─ Marks in_progress → PATCH /api/issues/{id}/status                       │
│  ├─ Submits after-photo → POST /api/resolution/{id}                         │
│  │   ├─ DINOv2 before/after: sim < 0.75 → visually_different                │
│  │   ├─ Gemini before/after: verified + confidence                           │
│  │   ├─ Combined verdict: BOTH must pass                                      │
│  │   ├─ resolutions.csv written                                               │
│  │   ├─ PASS: issues.csv status → "resolved"                                 │
│  │   │   + notification to citizen reporter                                   │
│  │   │   + broadcast to admins                                                │
│  │   └─ FAIL: issues.csv status → "reopened"                                 │
│  │       + history entry with AI reasoning                                    │
│  │                                                                             │
│  └─ Completed tab: shows only THIS worker's resolved issues                  │
│      (filtered by officer_id on API call)                                     │
│                                                                                │
│  ALL ROLES                                                                     │
│  └─ Notifications: poll /api/notifications/ every 30s                        │
│      Bell badge shows unread count                                            │
│      Assignment events → worker gets personal notif                           │
│      Resolution events → citizen + admin get notif                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Python 3.9+ (3.11 recommended)
- Node.js 18+
- Google Gemini API key — [get one free](https://aistudio.google.com/app/apikey)

### 1. Clone

```bash
git clone https://github.com/neevmodh/CityPulse_AI.git
cd CityPulse_AI
```

### 2. Backend

```bash
# Create and activate virtualenv
python3 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r citypulse-ai/backend/requirements.txt

# Configure environment
cp citypulse-ai/backend/.env.example citypulse-ai/backend/.env
# Edit .env and add your GEMINI_API_KEY

# Start backend
cd citypulse-ai/backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API: **http://localhost:8000**  
Swagger UI: **http://localhost:8000/docs**

### 3. Frontend

```bash
cd citypulse-ai/frontend
npm install
npm run dev      # development (hot reload)
# or
npm run build && npm start    # production
```

Frontend: **http://localhost:3000**

### 4. (Optional) Add YOLOv8 RDD Weights

```bash
# Place your custom RDD weights at:
citypulse-ai/backend/weights/yolov8_rdd.pt

# Without weights, falls back to yolov8n.pt (general detection)
```

### 5. (Optional) Reseed Data

```bash
cd citypulse-ai/backend
python seed_large.py    # generates 1000 fresh issues across all 10 wards
```

---

## Demo Accounts

Password for all accounts: **`demo123`**

| Role | Email | What you see |
|------|-------|-------------|
| **Citizen** | arjun@demo.com | Report wizard, issue tracker, contribution score |
| **Citizen** | priya@demo.com | Ward 3 — Satellite area issues |
| **Worker** | rajesh@demo.com | Road Maintenance dept, priority queue, SLA tracker |
| **Worker** | sunita@demo.com | Drainage dept, waterlogging + manhole queue |
| **Worker** | kamal@demo.com | Sanitation dept, garbage queue |
| **Admin** | admin@demo.com | Full city dashboard, all features |

Or click **"Try Demo"** on the landing page — no login needed.

---

## Environment Variables

### Backend — `citypulse-ai/backend/.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |
| `DATA_DIR` | No | `./data` | CSV storage directory |
| `UPLOADS_DIR` | No | `./uploads` | Uploaded images/audio directory |
| `YOLO_WEIGHTS` | No | `./weights/yolov8_rdd.pt` | Path to YOLOv8 RDD weights |
| `WHISPER_MODEL` | No | `tiny` | Whisper model size: `tiny/base/small` |
| `SECRET_KEY` | No | — | Session token signing key |
| `FRONTEND_URL` | No | — | Comma-separated list of allowed CORS origins |

### Frontend — `citypulse-ai/frontend/.env.local`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:8000` | Backend base URL |
| `NEXT_PUBLIC_DEMO_MODE` | No | `true` | Enables demo bypass on login page |

---

## Notes

- **CSV storage** — thread-safe via `threading.Lock`. Zero database setup. Every read returns a typed DataFrame; every write is atomic. Suitable for prototyping and demos; swap for PostgreSQL/SQLite for production scale.
- **YOLO weights** — `yolov8_rdd.pt` must be placed manually in `backend/weights/`. Without it, the system falls back to `yolov8n.pt` (general detection, lower road damage accuracy).
- **DINOv2 + PyTorch** — model downloads from HuggingFace Hub on first run (~300MB). Subsequent runs use cached model.
- **Whisper** — optional. Voice notes use typed description verbatim if Whisper not installed.
- **XGBoost model** — re-trained in-process on a tiny synthetic dataset each cold start. For production, serialize and load a pre-trained artifact.
- **Python 3.9** — works but shows deprecation warnings from Google SDKs. Python 3.11+ recommended.

---

<div align="center">

Built for **Ahmedabad Municipal Corporation — Smart City Initiative**

*CityPulse AI — Where civic problems meet autonomous resolution*

</div>
