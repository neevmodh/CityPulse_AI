"""Seed the CityPulse AI prototype CSV store with deterministic demo data."""
from __future__ import annotations

import csv
import hashlib
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

CSV_FIELDS = {
    "users": ["id", "name", "email", "password_hash", "role", "ward_id", "department_id", "created_at"],
    "issues": ["id", "issue_code", "reporter_id", "category", "description", "image_path", "latitude", "longitude", "ward_id", "severity", "risk_score", "priority", "status", "assigned_to", "department_id", "created_at", "updated_at"],
    "reports": ["id", "issue_id", "citizen_id", "image_path", "description", "latitude", "longitude", "created_at"],
    "ai_analyses": ["id", "issue_id", "model", "category", "confidence", "severity", "summary", "reasoning", "recommended_action", "raw_response", "created_at"],
    "risk_scores": ["id", "issue_id", "severity_score", "exposure_score", "location_score", "recurrence_score", "weather_score", "frequency_score", "final_score", "priority", "reasoning", "created_at"],
    "assignments": ["id", "issue_id", "department_id", "officer_id", "assigned_at", "sla_deadline", "status"],
    "issue_history": ["id", "issue_id", "old_status", "new_status", "changed_by", "notes", "timestamp"],
    "resolutions": ["id", "issue_id", "officer_id", "before_image", "after_image", "latitude", "longitude", "notes", "verification_status", "verification_score", "verification_reason", "resolved_at"],
    "hotspots": ["id", "name", "latitude", "longitude", "ward_id", "issue_count", "avg_risk_score", "trend", "prediction", "created_at"],
    "wards": ["id", "name", "lat_center", "lng_center", "health_score", "population", "area_sqkm", "councillor", "total_issues", "open_issues", "resolved_issues"],
    "departments": ["id", "name", "category", "sla_hours", "head", "email", "phone", "active_workers"],
}


def hash_password(password: str) -> str:
    """Match the prototype auth router's existing password format."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


PASSWORD_HASH = hash_password("demo123")
BASE_TIME = datetime(2026, 2, 1, 8, tzinfo=timezone.utc)

WARDS = [
    {"id": f"w{i:02d}", "name": name, "lat_center": str(lat), "lng_center": str(lng), "health_score": str(58 + (i * 7) % 30), "population": str(38000 + i * 4300), "area_sqkm": f"{3.0 + i / 3:.1f}", "councillor": f"Councillor Ward {i}", "total_issues": "4", "open_issues": "3", "resolved_issues": "1"}
    for i, (name, lat, lng) in enumerate([
        ("Sector 7 - Chandkheda", 23.1125, 72.5873), ("Maninagar", 22.9954, 72.6185),
        ("Satellite", 23.0300, 72.5100), ("Navrangpura", 23.0395, 72.5560),
        ("Gota", 23.1180, 72.5520), ("Bopal", 23.0350, 72.4700),
        ("Vatva GIDC", 22.9600, 72.6500), ("Vastral", 23.0250, 72.6650),
        ("Nikol", 23.0450, 72.6350), ("Naranpura", 23.0700, 72.5650),
    ], start=1)
]

DEPARTMENTS = [
    {"id": "dept-roads", "name": "Road Maintenance", "category": "pothole;crack;road_damage;footpath", "sla_hours": "48", "head": "Rajesh Kumar", "email": "roads@example.com", "phone": "9800001111", "active_workers": "12"},
    {"id": "dept-drain", "name": "Drainage & Waterlogging", "category": "waterlogging;manhole;drain", "sla_hours": "24", "head": "Sunita Verma", "email": "drainage@example.com", "phone": "9800002222", "active_workers": "8"},
    {"id": "dept-sanit", "name": "Sanitation & Waste", "category": "garbage;waste", "sla_hours": "72", "head": "Kamal Shah", "email": "sanitation@example.com", "phone": "9800003333", "active_workers": "15"},
]

USERS = [
    {"id": "u001", "name": "Arjun Mehta", "email": "arjun@demo.com", "password_hash": PASSWORD_HASH, "role": "citizen", "ward_id": "w01", "department_id": "", "created_at": "2026-01-10T09:00:00Z"},
    {"id": "u020", "name": "Rajesh Kumar", "email": "rajesh@demo.com", "password_hash": PASSWORD_HASH, "role": "worker", "ward_id": "w01", "department_id": "dept-roads", "created_at": "2026-01-05T08:00:00Z"},
    {"id": "u030", "name": "Anita Singh", "email": "admin@demo.com", "password_hash": PASSWORD_HASH, "role": "admin", "ward_id": "", "department_id": "", "created_at": "2026-01-01T07:00:00Z"},
]

HERO_SCENARIOS = [
    ("pothole", "A deep pothole is growing near a busy school crossing.", "critical"),
    ("waterlogging", "Monsoon waterlogging is blocking access to a residential lane.", "high"),
    ("streetlight", "A dark streetlight corridor is creating a night-time safety risk.", "high"),
    ("garbage", "Overflowing waste bins need a sanitation pickup before the weekend.", "medium"),
    ("road_damage", "Cracked road surface is spreading across a main commuter route.", "high"),
    ("fallen_tree", "A fallen tree is narrowing the footpath beside a market.", "critical"),
]


def iso(moment: datetime) -> str:
    return moment.isoformat().replace("+00:00", "Z")


def priority(score: int) -> str:
    return "P1" if score >= 80 else "P2" if score >= 60 else "P3" if score >= 40 else "P4"


def build_rows() -> dict[str, list[dict[str, str]]]:
    issues: list[dict[str, str]] = []
    reports: list[dict[str, str]] = []
    analyses: list[dict[str, str]] = []
    risks: list[dict[str, str]] = []
    assignments: list[dict[str, str]] = []
    history: list[dict[str, str]] = []
    resolutions: list[dict[str, str]] = []

    for index in range(40):
        number = index + 1
        ward = WARDS[index % 10]
        if index < len(HERO_SCENARIOS):
            category, description, severity = HERO_SCENARIOS[index]
        else:
            category = ["pothole", "garbage", "streetlight", "water_leak"][index % 4]
            description = f"Demo civic issue {number} reported in {ward['name']}."
            severity = ["low", "medium", "high"][index % 3]
        score = 86 - (index * 7) % 48
        issue_id = f"ISSUE-{number:03d}"
        created = BASE_TIME + timedelta(hours=index * 7)
        status = "resolved" if index % 8 == 0 else "assigned" if index % 5 == 0 else "ai_analyzed"
        worker_id = "u020" if index < 5 else ""
        issue = {"id": issue_id, "issue_code": f"CP-{number:04d}", "reporter_id": "u001", "category": category, "description": description, "image_path": "", "latitude": ward["lat_center"], "longitude": ward["lng_center"], "ward_id": ward["id"], "severity": severity, "risk_score": str(score), "priority": priority(score), "status": status, "assigned_to": worker_id, "department_id": "dept-roads", "created_at": iso(created), "updated_at": iso(created)}
        issues.append(issue)
        reports.append({"id": f"REPORT-{number:03d}", "issue_id": issue_id, "citizen_id": "u001", "image_path": "", "description": description, "latitude": ward["lat_center"], "longitude": ward["lng_center"], "created_at": iso(created)})
        analyses.append({"id": f"ANALYSIS-{number:03d}", "issue_id": issue_id, "model": "demo-fallback", "category": category, "confidence": "0.92", "severity": severity, "summary": description, "reasoning": "Traffic exposure and location context informed this prototype risk signal.", "recommended_action": "Inspect and schedule the appropriate municipal repair.", "raw_response": "", "created_at": iso(created)})
        risks.append({"id": f"RISK-{number:03d}", "issue_id": issue_id, "severity_score": str(score), "exposure_score": "70", "location_score": "65", "recurrence_score": "40", "weather_score": "20", "frequency_score": "30", "final_score": str(score), "priority": priority(score), "reasoning": "Prototype risk signal based on severity, exposure, and location.", "created_at": iso(created)})
        history.append({"id": f"HISTORY-{number:03d}", "issue_id": issue_id, "old_status": "reported", "new_status": status, "changed_by": "system", "notes": "Seeded prototype status history.", "timestamp": iso(created)})
        if status == "resolved":
            resolutions.append({"id": f"RESOLUTION-{number:03d}", "issue_id": issue_id, "officer_id": "u020", "before_image": "", "after_image": "", "latitude": ward["lat_center"], "longitude": ward["lng_center"], "notes": "Resolved in seeded demo data.", "verification_status": "verified", "verification_score": "0.94", "verification_reason": "Prototype verification", "resolved_at": iso(created + timedelta(hours=12))})

    for index, issue in enumerate(issues[:5]):
        assigned = BASE_TIME + timedelta(days=index + 1)
        assignments.append({"id": f"ASSIGNMENT-{index + 1:03d}", "issue_id": issue["id"], "department_id": "dept-roads", "officer_id": "u020", "assigned_at": iso(assigned), "sla_deadline": iso(assigned + timedelta(hours=48)), "status": "active"})

    hotspots = [{"id": f"HOTSPOT-{i:02d}", "name": ward["name"], "latitude": ward["lat_center"], "longitude": ward["lng_center"], "ward_id": ward["id"], "issue_count": "4", "avg_risk_score": str(62 + i), "trend": "rising" if i % 2 else "stable", "prediction": "Monitor recurring reports", "created_at": iso(BASE_TIME)} for i, ward in enumerate(WARDS[:8], start=1)]
    return {"users": USERS, "wards": WARDS, "departments": DEPARTMENTS, "issues": issues, "reports": reports, "ai_analyses": analyses, "risk_scores": risks, "assignments": assignments, "issue_history": history, "resolutions": resolutions, "hotspots": hotspots}


def seed_csv(name: str, rows: list[dict[str, str]]) -> None:
    path = DATA_DIR / f"{name}.csv"
    if path.exists() and path.stat().st_size > 0:
        print(f"[skip] {path}")
        return
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDS[name])
        writer.writeheader()
        writer.writerows(rows)
    print(f"[seed] {path} ({len(rows)} rows)")


def main() -> None:
    rows = build_rows()
    for name in CSV_FIELDS:
        seed_csv(name, rows.get(name, []))
    print("Seed complete: 40 issues across 10 wards, 5 assignments, and 6 hero scenarios.")


if __name__ == "__main__":
    main()
