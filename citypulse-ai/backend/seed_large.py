"""Expand the CSV demo store with deterministic, clustered city-scale data.

Usage:
    python3 seed_large.py --target 1000

The script preserves existing rows and appends records until the issue target is met.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

DATA_DIR = Path("./data")
SEED = 20260819
CATEGORIES = [
    ("pothole", 0.25, "Road Maintenance"), ("road_damage", 0.12, "Road Maintenance"),
    ("garbage", 0.18, "Sanitation & Waste"), ("waterlogging", 0.14, "Drainage & Waterlogging"),
    ("manhole", 0.10, "Drainage & Waterlogging"), ("streetlight", 0.09, "Street Lighting"),
    ("sewage", 0.05, "Water Supply"), ("fallen_tree", 0.04, "Parks & Trees"),
    ("other", 0.03, "Road Maintenance"),
]
WARDS = [
    ("w01", "Sector 7 - Chandkheda", 23.1125, 72.5873), ("w02", "Maninagar", 22.9954, 72.6185),
    ("w03", "Satellite", 23.0300, 72.5100), ("w04", "Navrangpura", 23.0395, 72.5560),
    ("w05", "Gota", 23.1180, 72.5520), ("w06", "Bopal", 23.0350, 72.4700),
    ("w07", "Vatva GIDC", 22.9600, 72.6500), ("w08", "Vastral", 23.0250, 72.6650),
    ("w09", "Nikol", 23.0450, 72.6350), ("w10", "Naranpura", 23.0700, 72.5650),
]
SEVERITIES = [("low", 0.22), ("medium", 0.48), ("high", 0.23), ("critical", 0.07)]
STATUSES = [("reported", 0.10), ("ai_analyzed", 0.18), ("assigned", 0.25), ("in_progress", 0.25), ("resolved", 0.17), ("reopened", 0.05)]
WORKERS = ["u020", "u021", "u022"]
DEPARTMENTS = {"Road Maintenance": "dept-roads", "Sanitation & Waste": "dept-sanit", "Drainage & Waterlogging": "dept-drain", "Street Lighting": "dept-light", "Water Supply": "dept-water", "Parks & Trees": "dept-parks"}


def choose(rng: random.Random, weighted: list[tuple[str, float]]) -> str:
    value = rng.random()
    total = 0.0
    for item, weight in weighted:
        total += weight
        if value <= total:
            return item
    return weighted[-1][0]


def read_rows(name: str) -> tuple[list[str], list[dict[str, str]]]:
    path = DATA_DIR / f"{name}.csv"
    if not path.exists():
        return [], []
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def append_rows(name: str, new_rows: list[dict[str, str]]) -> None:
    if not new_rows:
        return
    fields, existing = read_rows(name)
    if not fields:
        fields = list(new_rows[0].keys())
    with (DATA_DIR / f"{name}.csv").open("a", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        if not existing:
            writer.writeheader()
        writer.writerows({field: row.get(field, "") for field in fields} for row in new_rows)


def backfill_relations() -> None:
    """Give legacy demo rows the same supporting records as bulk rows."""
    _, issues = read_rows("issues")
    for name, key in (("reports", "issue_id"), ("ai_analyses", "issue_id"), ("risk_scores", "issue_id"), ("issue_history", "issue_id")):
        _, rows = read_rows(name)
        present = {row.get(key) for row in rows}
        missing = []
        for issue in issues:
            if issue.get("id") in present:
                continue
            missing.append(issue)
        if not missing:
            continue
        generated = []
        for issue in missing:
            issue_id = issue.get("id", "")
            if name == "reports":
                generated.append({"id": f"backfill-report-{issue_id}", "issue_id": issue_id, "citizen_id": issue.get("reporter_id", "u001"), "image_path": issue.get("image_path", ""), "description": issue.get("description", ""), "latitude": issue.get("latitude", ""), "longitude": issue.get("longitude", ""), "created_at": issue.get("created_at", "")})
            elif name == "ai_analyses":
                generated.append({"id": f"backfill-analysis-{issue_id}", "issue_id": issue_id, "model": "demo-fusion-fallback", "category": issue.get("category", "other"), "confidence": "0.85", "severity": issue.get("severity", "medium"), "summary": issue.get("description", ""), "reasoning": "Backfilled prototype analysis.", "recommended_action": "Inspect and route to the responsible department.", "raw_response": "", "created_at": issue.get("created_at", "")})
            elif name == "risk_scores":
                generated.append({"id": f"backfill-risk-{issue_id}", "issue_id": issue_id, "severity_score": issue.get("risk_score", "0"), "exposure_score": "10", "location_score": "8", "recurrence_score": "4", "weather_score": "2", "frequency_score": "1", "final_score": issue.get("risk_score", "0"), "priority": issue.get("priority", "P4"), "reasoning": "Backfilled prototype risk signal.", "created_at": issue.get("created_at", "")})
            else:
                generated.append({"id": f"backfill-history-{issue_id}", "issue_id": issue_id, "old_status": "reported", "new_status": issue.get("status", "reported"), "changed_by": "system", "notes": "Backfilled prototype lifecycle history.", "timestamp": issue.get("created_at", "")})
        append_rows(name, generated)


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", type=int, default=1000)
    args = parser.parse_args()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    rng = random.Random(SEED)
    _, existing_issues = read_rows("issues")
    start = len(existing_issues) + 1
    count = max(0, args.target - len(existing_issues))
    if count == 0:
        backfill_relations()
        print(f"Already have {len(existing_issues)} issues; nothing to append.")
        return

    _, users = read_rows("users")
    citizens = [row for row in users if row.get("role") == "citizen"]
    if len(citizens) < 100:
        new_users = []
        for index in range(len(citizens) + 1, 101):
            new_users.append({
                "id": f"u{100 + index:03d}", "name": f"Demo Citizen {index}",
                "email": f"citizen{index}@demo.com", "password_hash": hash_password("demo123"),
                "role": "citizen", "ward_id": f"w{((index - 1) % 10) + 1:02d}",
                "department_id": "", "created_at": "2026-01-20T08:00:00Z",
            })
        append_rows("users", new_users)
        citizens.extend(new_users)

    issues, reports, analyses, risks, histories, assignments, resolutions = [], [], [], [], [], [], []
    base_time = datetime(2026, 8, 19, 12, tzinfo=timezone.utc)
    for offset in range(count):
        number = start + offset
        ward_id, ward_name, center_lat, center_lng = WARDS[offset % len(WARDS)]
        category, _, department_name = CATEGORIES[offset % len(CATEGORIES)]
        # Repeat a few micro-clusters per ward so heatmaps show meaningful density.
        cluster = (offset // 10) % 5
        lat = center_lat + (cluster - 2) * 0.002 + rng.gauss(0, 0.0007)
        lng = center_lng + (cluster - 2) * 0.002 + rng.gauss(0, 0.0007)
        severity = choose(rng, SEVERITIES)
        status = choose(rng, STATUSES)
        severity_base = {"low": 18, "medium": 42, "high": 68, "critical": 88}[severity]
        recurrence = min(15, (offset % 7) * 2)
        exposure = {"pothole": 18, "road_damage": 18, "manhole": 20, "waterlogging": 17, "garbage": 11, "streetlight": 13, "sewage": 16, "fallen_tree": 16, "other": 8}[category]
        risk = max(8, min(99, severity_base + exposure // 2 + recurrence + (offset % 6)))
        priority = "P1" if risk >= 80 else "P2" if risk >= 60 else "P3" if risk >= 40 else "P4"
        created = base_time - timedelta(days=rng.randint(0, 45), hours=rng.randint(0, 23))
        issue_id = f"bulk-{number:05d}"
        reporter = citizens[offset % len(citizens)].get("id", "u001")
        worker = WORKERS[offset % len(WORKERS)] if status in {"assigned", "in_progress", "resolved"} else ""
        department_id = DEPARTMENTS.get(department_name, "dept-roads")
        description = f"{category.replace('_', ' ').title()} reported near {ward_name}; clustered prototype observation {number}."
        issues.append({"id": issue_id, "issue_code": f"CP-{number:05d}", "reporter_id": reporter, "category": category, "description": description, "image_path": "", "latitude": f"{lat:.6f}", "longitude": f"{lng:.6f}", "ward_id": ward_id, "severity": severity, "risk_score": str(risk), "priority": priority, "status": status, "assigned_to": worker, "department_id": department_id, "created_at": created.isoformat().replace("+00:00", "Z"), "updated_at": created.isoformat().replace("+00:00", "Z")})
        reports.append({"id": f"bulk-report-{number:05d}", "issue_id": issue_id, "citizen_id": reporter, "image_path": "", "description": description, "latitude": f"{lat:.6f}", "longitude": f"{lng:.6f}", "created_at": created.isoformat().replace("+00:00", "Z")})
        analyses.append({"id": f"bulk-analysis-{number:05d}", "issue_id": issue_id, "model": "demo-fusion-yolo-gemini", "category": category, "confidence": f"{rng.uniform(.78, .98):.2f}", "severity": severity, "summary": description, "reasoning": "Prototype fusion of visual severity, location exposure, recurrence, and weather context.", "recommended_action": f"Inspect and route to {department_name}.", "raw_response": "", "created_at": created.isoformat().replace("+00:00", "Z")})
        risks.append({"id": f"bulk-risk-{number:05d}", "issue_id": issue_id, "severity_score": str(severity_base), "exposure_score": str(exposure), "location_score": str(8 + (offset % 12)), "recurrence_score": str(recurrence), "weather_score": str(2 + (offset % 9)), "frequency_score": str(1 + (offset % 5)), "final_score": str(risk), "priority": priority, "reasoning": "Synthetic prototype risk signal with clustered geographic exposure.", "created_at": created.isoformat().replace("+00:00", "Z")})
        histories.append({"id": f"bulk-history-{number:05d}", "issue_id": issue_id, "old_status": "reported", "new_status": status, "changed_by": "system", "notes": "Seeded lifecycle state.", "timestamp": created.isoformat().replace("+00:00", "Z")})
        if worker:
            assigned = created + timedelta(hours=2)
            assignments.append({"id": f"bulk-assignment-{number:05d}", "issue_id": issue_id, "department_id": department_id, "officer_id": worker, "assigned_at": assigned.isoformat().replace("+00:00", "Z"), "sla_deadline": (assigned + timedelta(hours=48)).isoformat().replace("+00:00", "Z"), "status": "active" if status != "resolved" else "completed"})
        if status == "resolved":
            resolutions.append({"id": f"bulk-resolution-{number:05d}", "issue_id": issue_id, "officer_id": worker, "before_image": "", "after_image": "", "latitude": f"{lat:.6f}", "longitude": f"{lng:.6f}", "notes": "Seeded verified resolution.", "started_at": created.isoformat().replace("+00:00", "Z"), "completed_at": (created + timedelta(hours=6)).isoformat().replace("+00:00", "Z"), "time_taken_hours": "6", "verification_status": "verified", "verification_score": "0.92", "verification_reason": "Seeded prototype verification.", "resolved_at": (created + timedelta(hours=6)).isoformat().replace("+00:00", "Z")})

    append_rows("issues", issues)
    append_rows("reports", reports)
    append_rows("ai_analyses", analyses)
    append_rows("risk_scores", risks)
    append_rows("issue_history", histories)
    append_rows("assignments", assignments)
    append_rows("resolutions", resolutions)
    backfill_relations()
    print(f"Appended {count} issues; total is now {start + count - 1}. Added {len(assignments)} assignments and {len(resolutions)} resolutions.")


if __name__ == "__main__":
    main()
