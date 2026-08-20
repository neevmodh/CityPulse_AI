"""
CityPulse AI — Data Seeder
Run this once on first startup to seed all CSVs with demo data.
Usage: python seed_data.py
"""
import os
import csv
import hashlib
from pathlib import Path

DATA_DIR = Path("./data")
DATA_DIR.mkdir(exist_ok=True)

# Simple SHA-256 password hash (matches auth.py logic)
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

DEMO_PASSWORD = hash_password("demo123")

# ─── Seed definitions ────────────────────────────────────────────────────────

USERS = [
    {"id": "u001", "name": "Arjun Mehta",  "email": "arjun@demo.com",  "password_hash": DEMO_PASSWORD, "role": "citizen", "ward_id": "w01", "department_id": "", "created_at": "2026-01-10T09:00:00Z"},
    {"id": "u002", "name": "Priya Sharma", "email": "priya@demo.com",  "password_hash": DEMO_PASSWORD, "role": "citizen", "ward_id": "w03", "department_id": "", "created_at": "2026-01-12T10:00:00Z"},
    {"id": "u003", "name": "Meera Patel",  "email": "meera@demo.com",  "password_hash": DEMO_PASSWORD, "role": "citizen", "ward_id": "w02", "department_id": "", "created_at": "2026-01-15T11:00:00Z"},
    {"id": "u004", "name": "Vikram Desai", "email": "vikram@demo.com", "password_hash": DEMO_PASSWORD, "role": "citizen", "ward_id": "w01", "department_id": "", "created_at": "2026-01-18T08:00:00Z"},
    {"id": "u020", "name": "Rajesh Kumar", "email": "rajesh@demo.com", "password_hash": DEMO_PASSWORD, "role": "worker",  "ward_id": "w01", "department_id": "dept-roads", "created_at": "2026-01-05T08:00:00Z"},
    {"id": "u021", "name": "Sunita Verma", "email": "sunita@demo.com", "password_hash": DEMO_PASSWORD, "role": "worker",  "ward_id": "w02", "department_id": "dept-drain", "created_at": "2026-01-05T08:00:00Z"},
    {"id": "u022", "name": "Kamal Shah",   "email": "kamal@demo.com",  "password_hash": DEMO_PASSWORD, "role": "worker",  "ward_id": "w03", "department_id": "dept-sanit", "created_at": "2026-01-05T08:00:00Z"},
    {"id": "u030", "name": "Anita Singh",  "email": "admin@demo.com",  "password_hash": DEMO_PASSWORD, "role": "admin",   "ward_id": "",    "department_id": "", "created_at": "2026-01-01T07:00:00Z"},
]

WARDS = [
    {"id": "w01", "name": "Sector 7 - Chandkheda",  "lat_center": "23.1125", "lng_center": "72.5873", "health_score": "72", "population": "68000", "area_sqkm": "4.2", "councillor": "Bharat Patel",    "total_issues": "18", "open_issues": "9",  "resolved_issues": "9"},
    {"id": "w02", "name": "Maninagar",               "lat_center": "22.9954", "lng_center": "72.6185", "health_score": "65", "population": "82000", "area_sqkm": "5.1", "councillor": "Rekha Shah",       "total_issues": "22", "open_issues": "13", "resolved_issues": "9"},
    {"id": "w03", "name": "Satellite",               "lat_center": "23.0300", "lng_center": "72.5100", "health_score": "78", "population": "95000", "area_sqkm": "6.3", "councillor": "Dinesh Mehta",     "total_issues": "15", "open_issues": "6",  "resolved_issues": "9"},
    {"id": "w04", "name": "Navrangpura",             "lat_center": "23.0395", "lng_center": "72.5560", "health_score": "81", "population": "71000", "area_sqkm": "3.8", "councillor": "Hina Desai",       "total_issues": "11", "open_issues": "4",  "resolved_issues": "7"},
    {"id": "w05", "name": "Gota",                    "lat_center": "23.1180", "lng_center": "72.5520", "health_score": "69", "population": "54000", "area_sqkm": "4.9", "councillor": "Suresh Thakor",    "total_issues": "16", "open_issues": "8",  "resolved_issues": "8"},
    {"id": "w06", "name": "Bopal",                   "lat_center": "23.0350", "lng_center": "72.4700", "health_score": "74", "population": "61000", "area_sqkm": "5.5", "councillor": "Kavita Joshi",     "total_issues": "13", "open_issues": "6",  "resolved_issues": "7"},
    {"id": "w07", "name": "Vatva GIDC",              "lat_center": "22.9600", "lng_center": "72.6500", "health_score": "58", "population": "43000", "area_sqkm": "3.2", "councillor": "Ramesh Solanki",   "total_issues": "20", "open_issues": "12", "resolved_issues": "8"},
    {"id": "w08", "name": "Vastral",                 "lat_center": "23.0250", "lng_center": "72.6650", "health_score": "62", "population": "38000", "area_sqkm": "2.9", "councillor": "Nilesh Rana",      "total_issues": "17", "open_issues": "9",  "resolved_issues": "8"},
    {"id": "w09", "name": "Nikol",                   "lat_center": "23.0450", "lng_center": "72.6350", "health_score": "70", "population": "49000", "area_sqkm": "3.6", "councillor": "Dipika Chauhan",   "total_issues": "14", "open_issues": "7",  "resolved_issues": "7"},
    {"id": "w10", "name": "Naranpura",               "lat_center": "23.0700", "lng_center": "72.5650", "health_score": "76", "population": "56000", "area_sqkm": "4.1", "councillor": "Pravin Modi",      "total_issues": "12", "open_issues": "5",  "resolved_issues": "7"},
]

DEPARTMENTS = [
    {"id": "dept-roads",   "name": "Road Maintenance",       "category": "pothole;crack;road_damage;footpath",      "sla_hours": "48",  "head": "Rajesh Kumar",  "email": "roads@amc.gov.in",     "phone": "9800001111", "active_workers": "12"},
    {"id": "dept-drain",   "name": "Drainage & Waterlogging","category": "waterlogging;manhole;drain",              "sla_hours": "24",  "head": "Sunita Verma",  "email": "drainage@amc.gov.in",  "phone": "9800002222", "active_workers": "8"},
    {"id": "dept-sanit",   "name": "Sanitation & Waste",     "category": "garbage;waste",                           "sla_hours": "72",  "head": "Kamal Shah",    "email": "sanitation@amc.gov.in","phone": "9800003333", "active_workers": "15"},
    {"id": "dept-light",   "name": "Street Lighting",        "category": "streetlight",                             "sla_hours": "96",  "head": "Mohan Nair",    "email": "lighting@amc.gov.in",  "phone": "9800004444", "active_workers": "6"},
    {"id": "dept-parks",   "name": "Parks & Trees",          "category": "fallen_tree;footpath;park_damage",        "sla_hours": "72",  "head": "Geeta Iyer",    "email": "parks@amc.gov.in",     "phone": "9800005555", "active_workers": "5"},
    {"id": "dept-water",   "name": "Water Supply",           "category": "sewage;water_leak;pipe_burst",            "sla_hours": "24",  "head": "Anil Bose",     "email": "water@amc.gov.in",     "phone": "9800006666", "active_workers": "7"},
    {"id": "dept-emerg",   "name": "Emergency Response",     "category": "critical;electrical_hazard",              "sla_hours": "12",  "head": "Vijay Nair",    "email": "emergency@amc.gov.in", "phone": "9800007777", "active_workers": "10"},
    {"id": "dept-traffic", "name": "Traffic & Signals",      "category": "traffic_signal;road_marking",             "sla_hours": "48",  "head": "Priti Shah",    "email": "traffic@amc.gov.in",   "phone": "9800008888", "active_workers": "6"},
]


def seed_csv(filename: str, rows: list[dict]) -> None:
    path = DATA_DIR / f"{filename}.csv"
    if path.exists() and path.stat().st_size > 0:
        print(f"  [SKIP] {filename}.csv already exists and has data.")
        return
    if not rows:
        return
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"  [OK]   {filename}.csv seeded with {len(rows)} rows.")


def main():
    print("CityPulse AI — Seeding demo data...")
    print(f"Data directory: {DATA_DIR.resolve()}")
    print()

    seed_csv("users",       USERS)
    seed_csv("wards",       WARDS)
    seed_csv("departments", DEPARTMENTS)

    # For large CSVs (issues, reports, etc.) — only seed if completely missing
    large_files = ["issues", "reports", "ai_analyses", "risk_scores",
                   "assignments", "issue_history", "resolutions", "hotspots"]
    for fname in large_files:
        path = DATA_DIR / f"{fname}.csv"
        if path.exists() and path.stat().st_size > 0:
            print(f"  [SKIP] {fname}.csv already exists.")
        else:
            print(f"  [WARN] {fname}.csv is missing — run the app to auto-generate or copy from /data/.")

    print()
    print("Seeding complete.")
    print()
    print("Demo login credentials:")
    print("  Citizens:  arjun@demo.com / demo123")
    print("             priya@demo.com / demo123")
    print("             meera@demo.com / demo123")
    print("             vikram@demo.com / demo123")
    print("  Workers:   rajesh@demo.com / demo123")
    print("             sunita@demo.com / demo123")
    print("             kamal@demo.com  / demo123")
    print("  Admin:     admin@demo.com  / demo123")


if __name__ == "__main__":
    main()
