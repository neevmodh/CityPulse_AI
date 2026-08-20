"""
CityPulse AI — Deterministic, Explainable Risk Engine
Risk = weighted sum of 6 factors, each scored 0–max_weight. Final score is 0–100.
"""
from __future__ import annotations

from services.csv_store import read_csv, append_row, update_row, new_id, now_iso
from services.priority_model import predict

WEIGHTS = {
    "severity":   30,
    "exposure":   20,
    "location":   20,
    "recurrence": 15,
    "weather":    10,
    "frequency":   5,
}

SEVERITY_MAP = {"critical": 30, "high": 22, "medium": 14, "low": 6}

CATEGORY_EXPOSURE = {
    "pothole": 18, "crack": 14, "road_damage": 16,
    "manhole": 16, "waterlogging": 14,
    "garbage": 10, "streetlight": 12,
    "tree": 8,  "fallen_tree": 8, "footpath": 10,
    "electrical_hazard": 20,
    "water_leak": 14, "sewage": 16,
    "traffic_signal": 12, "park_damage": 6,
    "other": 6,
}

SENSITIVE_LOCATIONS = [
    {"type": "school",   "radius_m": 200, "bonus": 8},
    {"type": "hospital", "radius_m": 300, "bonus": 10},
    {"type": "bus_stop", "radius_m": 100, "bonus": 4},
    {"type": "market",   "radius_m": 150, "bonus": 5},
]


def calculate_risk(
    severity: str,
    category: str,
    latitude: float,
    longitude: float,
    recurrence_count: int = 0,
    rain_active: bool = False,
    report_count: int = 1,
    nearby_sensitive: list | None = None,
) -> dict:
    reasons = []

    # 1. Severity (0–30)
    s_score = SEVERITY_MAP.get(severity, 10)
    reasons.append(f"Severity '{severity}' → {s_score}/30")

    # 2. Traffic/Exposure (0–20)
    e_score = CATEGORY_EXPOSURE.get(category, 10)
    reasons.append(f"Category '{category}' exposure → {e_score}/20")

    # 3. Location sensitivity (0–20)
    l_score = 8  # base
    if nearby_sensitive:
        for loc in nearby_sensitive:
            bonus   = loc.get("bonus", 3)
            l_score = min(20, l_score + bonus)
            reasons.append(f"  +{bonus}: {loc['type']} nearby")
    reasons.append(f"Location sensitivity → {l_score}/20")

    # 4. Recurrence (0–15)
    r_score = min(15, recurrence_count * 4)
    if recurrence_count > 0:
        reasons.append(f"{recurrence_count} prior reports → {r_score}/15")

    # 5. Weather (0–10)
    w_score = 8 if rain_active else 2
    if rain_active:
        reasons.append(f"Active rainfall warning → {w_score}/10")

    # 6. Frequency/complaint count (0–5)
    f_score = min(5, report_count)
    reasons.append(f"{report_count} total reports → {f_score}/5")

    model_result = predict(
        {
            "severity": s_score,
            "exposure": e_score,
            "location": l_score,
            "recurrence": r_score,
            "weather": w_score,
            "frequency": f_score,
        },
        category=category,
        exposure_context="high_pedestrian" if nearby_sensitive else "",
    )
    total = model_result["score"]
    priority = model_result["priority"]
    reasons.append(f"{model_result['model']} priority prediction → {priority} ({total})")

    return {
        "severity_score":   s_score,
        "exposure_score":   e_score,
        "location_score":   l_score,
        "recurrence_score": r_score,
        "weather_score":    w_score,
        "frequency_score":  f_score,
        "final_score":      total,
        "priority":         priority,
        "reasoning":        " | ".join(reasons),
    }


def compute_and_store(issue: dict, report_count: int = 1) -> dict:
    """Run risk engine and persist result. Returns risk score dict."""
    # Count prior issues at same location (recurrence)
    issues_df = read_csv("issues")
    recurrence = 0
    if not issues_df.empty and "category" in issues_df.columns:
        mask = (
            (issues_df["category"] == issue.get("category", "")) &
            (issues_df["ward_id"]   == issue.get("ward_id", "")) &
            (issues_df["id"]        != issue.get("id", ""))
        )
        recurrence = int(mask.sum())

    scores = calculate_risk(
        severity        = issue.get("severity", "medium"),
        category        = issue.get("category", "other"),
        latitude        = float(issue.get("latitude", 0)),
        longitude       = float(issue.get("longitude", 0)),
        recurrence_count= recurrence,
        rain_active     = False,     # extend with weather API
        report_count    = report_count,
        nearby_sensitive= None,
    )

    # Map priority label to severity string for issues table
    severity_label = {
        "P1": "critical", "P2": "high", "P3": "medium", "P4": "low"
    }.get(scores["priority"], "medium")

    row = {
        "id":               new_id("RSK"),
        "issue_id":         issue.get("id", ""),
        "severity_score":   scores["severity_score"],
        "exposure_score":   scores["exposure_score"],
        "location_score":   scores["location_score"],
        "recurrence_score": scores["recurrence_score"],
        "weather_score":    scores["weather_score"],
        "frequency_score":  scores["frequency_score"],
        "final_score":      scores["final_score"],
        "priority":         scores["priority"],
        "reasoning":        scores["reasoning"],
        "created_at":       now_iso(),
    }

    # Upsert: delete old + append new
    risk_df = read_csv("risk_scores")
    if not risk_df.empty and "issue_id" in risk_df.columns:
        existing = risk_df[risk_df["issue_id"] == issue.get("id", "")]
        if not existing.empty:
            update_row("risk_scores", "issue_id", issue["id"], row)
        else:
            append_row("risk_scores", row)
    else:
        append_row("risk_scores", row)

    # Update issue record with new score + priority
    update_row("issues", "id", issue["id"], {
        "risk_score": scores["final_score"],
        "priority":   scores["priority"],
        "severity":   severity_label,
    })

    return {**row, **scores}
