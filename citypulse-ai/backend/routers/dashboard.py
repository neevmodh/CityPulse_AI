from fastapi import APIRouter, Query
from typing import Optional
from services.csv_store import read_csv
from services.hotspot_service import detect_hotspots
import math

router = APIRouter()


def _clean_record(record: dict) -> dict:
    return {key: "" if value is None or (isinstance(value, float) and math.isnan(value)) else value for key, value in record.items()}


def _safe_float(v, default=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


# GET /api/dashboard/summary
@router.get("/summary")
def summary(role: str = "admin", user_id: Optional[str] = None):
    issues_df = read_csv("issues")
    if issues_df.empty:
        return {"total": 0, "open": 0, "in_progress": 0, "resolved": 0, "critical": 0}

    filtered = issues_df
    if role == "citizen" and user_id:
        filtered = issues_df[issues_df["reporter_id"] == user_id]
    elif role == "worker" and user_id:
        filtered = issues_df[issues_df["assigned_to"] == user_id]

    return {
        "total":       len(filtered),
        "open":        int((filtered["status"] == "open").sum()),
        "in_progress": int((filtered["status"] == "in_progress").sum()),
        "resolved":    int((filtered["status"] == "resolved").sum()),
        "critical":    int((filtered.get("priority", "") == "P1").sum()) if "priority" in filtered.columns else 0,
        "assigned":    int((filtered["status"] == "assigned").sum()),
    }


# GET /api/dashboard/priority — sorted priority queue
@router.get("/priority")
def priority_queue(
    officer_id: Optional[str] = None,
    limit: int = Query(50, le=200),
):
    df = read_csv("issues")
    if df.empty:
        return {"issues": []}
    active = df[df["status"].isin(["open", "assigned", "in_progress", "ai_analyzed", "verified"])]
    if officer_id:
        active = active[active["assigned_to"] == officer_id]
    if "risk_score" in active.columns:
        active = active.copy()
        active["_rs"] = active["risk_score"].apply(lambda x: _safe_float(x))
        active = active.sort_values("_rs", ascending=False).drop(columns=["_rs"])
    return {"issues": active.head(limit).to_dict("records")}


# GET /api/dashboard/health — city health score + ward breakdown
@router.get("/health")
def city_health():
    issues_df = read_csv("issues")
    wards_df  = read_csv("wards")

    total    = len(issues_df) if not issues_df.empty else 0
    open_c   = int((issues_df["status"].isin(["open","ai_analyzed"])).sum()) if not issues_df.empty else 0
    critical = int((issues_df.get("priority", "") == "P1").sum()) if not issues_df.empty and "priority" in issues_df.columns else 0

    health_score = max(0, min(100, round(100 - (critical * 2.5 + open_c * 1.2), 1)))

    wards = []
    if not wards_df.empty:
        wards = wards_df.to_dict("records")

    return {
        "health_score":    health_score,
        "total_issues":    total,
        "open_issues":     open_c,
        "critical_issues": critical,
        "wards":           wards,
    }


# GET /api/dashboard/issues-map — lat/lng for all issues
@router.get("/issues-map")
def issues_map(status: Optional[str] = None, ward_id: Optional[str] = None):
    df = read_csv("issues")
    if df.empty:
        return {"issues": []}
    if status:   df = df[df["status"]  == status]
    if ward_id:  df = df[df["ward_id"] == ward_id]
    cols = ["id","issue_code","category","priority","risk_score","status",
            "latitude","longitude","ward_id","title","description"]
    available = [c for c in cols if c in df.columns]
    return {"issues": df[available].to_dict("records")}


@router.get("/heatmap")
def heatmap(kind: str = "risk", ward_id: Optional[str] = None, cell_size: float = Query(0.003, gt=0.0005, le=0.02)):
    """Return weighted geographic cells for complaint or risk density heatmaps."""
    df = read_csv("issues")
    if df.empty:
        return {"kind": kind, "cells": []}
    if ward_id and ward_id != "all" and "ward_id" in df.columns:
        df = df[df["ward_id"] == ward_id]
    if kind not in {"complaints", "risk"}:
        kind = "risk"
    rows = []
    for row in df.fillna("").to_dict("records"):
        try:
            lat = float(row.get("latitude", 0))
            lng = float(row.get("longitude", 0))
            risk = _safe_float(row.get("risk_score", 0))
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                continue
            cell_lat = round(lat / cell_size) * cell_size
            cell_lng = round(lng / cell_size) * cell_size
            rows.append((cell_lat, cell_lng, risk))
        except (TypeError, ValueError):
            continue
    grouped: dict[tuple[float, float], list[float]] = {}
    for lat, lng, risk in rows:
        grouped.setdefault((lat, lng), []).append(risk)
    max_value = max((len(values) if kind == "complaints" else sum(values) / len(values) for values in grouped.values()), default=1)
    cells = []
    for (lat, lng), values in grouped.items():
        value = len(values) if kind == "complaints" else round(sum(values) / len(values), 1)
        cells.append({"latitude": round(lat, 6), "longitude": round(lng, 6), "value": value, "intensity": round(value / max_value, 4), "issue_count": len(values), "avg_risk_score": round(sum(values) / len(values), 1)})
    cells.sort(key=lambda cell: cell["intensity"], reverse=True)
    return {"kind": kind, "cell_size": cell_size, "cells": cells}


# GET /api/dashboard/hotspots
@router.get("/hotspots")
def hotspots_endpoint(refresh: bool = False):
    if refresh:
        spots = detect_hotspots()
        return {"hotspots": spots}
    df = read_csv("hotspots")
    if df.empty:
        return {"hotspots": []}
    return {"hotspots": df.to_dict("records")}


# GET /api/dashboard/analytics — charts data (fully real, no mocks)
@router.get("/analytics")
def analytics(ward_id: Optional[str] = None, days: int = 30, category: Optional[str] = None):
    from datetime import datetime, timezone, timedelta

    df = read_csv("issues")
    if df.empty:
        return {
            "by_category": {}, "by_status": {}, "by_ward": {},
            "by_priority": {}, "wards": [], "total": 0,
            "weekly_trend": [], "dept_resolution": [], "priority_counts": {},
        }

    if ward_id and ward_id != "all" and "ward_id" in df.columns:
        df = df[df["ward_id"] == ward_id]
    if category and category != "all" and "category" in df.columns:
        df = df[df["category"] == category]

    by_cat  = df["category"].value_counts().to_dict() if "category" in df.columns else {}
    by_stat = df["status"].value_counts().to_dict()   if "status"   in df.columns else {}
    by_ward = df["ward_id"].value_counts().to_dict()  if "ward_id"  in df.columns else {}
    by_prio = df["priority"].value_counts().to_dict() if "priority" in df.columns else {}

    # ── Real weekly trend (last 8 ISO weeks) ──────────────────────────────────
    weekly_trend = []
    try:
        now = datetime.now(timezone.utc)
        for w in range(7, -1, -1):
            week_start = now - timedelta(weeks=w + 1)
            week_end   = now - timedelta(weeks=w)
            label      = f"W{8 - w}"
            if "created_at" in df.columns:
                mask_rep = df["created_at"].apply(
                    lambda x: week_start.isoformat() <= str(x) < week_end.isoformat()
                )
                reported = int(mask_rep.sum())
            else:
                reported = 0
            if "updated_at" in df.columns and "status" in df.columns:
                mask_res = (
                    df["status"].isin(["resolved", "closed"]) &
                    df["updated_at"].apply(
                        lambda x: week_start.isoformat() <= str(x) < week_end.isoformat()
                    )
                )
                resolved = int(mask_res.sum())
            else:
                resolved = 0
            weekly_trend.append({"week": label, "reported": reported, "resolved": resolved})
    except Exception:
        weekly_trend = []

    # ── Real dept resolution times from resolutions + departments ─────────────
    dept_resolution = []
    try:
        res_df  = read_csv("resolutions")
        dept_df = read_csv("departments")
        issues_df_all = read_csv("issues")
        if not dept_df.empty:
            for _, drow in dept_df.iterrows():
                dept_id   = str(drow.get("id", ""))
                dept_name = str(drow.get("name", dept_id))
                sla_target = _safe_float(drow.get("sla_hours", 48)) / 24  # hours → days

                avg_days = sla_target  # default = target (perfect)
                if not res_df.empty and "officer_id" in res_df.columns and not issues_df_all.empty:
                    dept_issues = issues_df_all[issues_df_all["department_id"] == dept_id]
                    if not dept_issues.empty and "time_taken_hours" in res_df.columns:
                        dept_issue_ids = set(dept_issues["id"].tolist())
                        dept_res = res_df[res_df.get("issue_id", res_df.index.to_series()).apply(
                            lambda x: str(x) in dept_issue_ids
                        )]
                        valid_times = dept_res["time_taken_hours"].apply(
                            lambda x: float(x) if str(x).replace(".", "").replace("-","").isdigit() else None
                        ).dropna()
                        if len(valid_times) > 0:
                            avg_days = round(float(valid_times.mean()) / 24, 1)

                dept_resolution.append({
                    "dept":     dept_name[:12],
                    "avg_days": round(avg_days, 1),
                    "target":   round(sla_target, 1),
                })
    except Exception:
        dept_resolution = []

    # ── Real priority counts ───────────────────────────────────────────────────
    priority_map_label = {"P1": "P1 Critical", "P2": "P2 High", "P3": "P3 Medium", "P4": "P4 Low",
                          "critical": "P1 Critical", "high": "P2 High", "medium": "P3 Medium", "low": "P4 Low"}
    priority_counts: dict = {}
    if "priority" in df.columns:
        for k, v in df["priority"].value_counts().to_dict().items():
            label = priority_map_label.get(str(k), str(k))
            priority_counts[label] = priority_counts.get(label, 0) + int(v)

    wards_df = read_csv("wards")
    wards    = wards_df.to_dict("records") if not wards_df.empty else []

    return {
        "by_category":    by_cat,
        "by_status":      by_stat,
        "by_ward":        by_ward,
        "by_priority":    by_prio,
        "wards":          wards,
        "total":          len(df),
        "weekly_trend":   weekly_trend,
        "dept_resolution":dept_resolution,
        "priority_counts":priority_counts,
    }


# GET /api/dashboard/admin  (keeps backward compat for frontend)
@router.get("/admin")
def admin_dashboard():
    health        = city_health()
    hs_resp       = hotspots_endpoint()
    analytics_data = analytics()

    issues_df = read_csv("issues")
    resolved_count = 0
    avg_response_days = 0.0
    if not issues_df.empty:
        resolved_count = int((issues_df["status"] == "resolved").sum())
        # Avg response: mean of (updated_at - created_at) for resolved issues
        try:
            from datetime import datetime
            resolved = issues_df[issues_df["status"] == "resolved"]
            if not resolved.empty and "created_at" in resolved.columns and "updated_at" in resolved.columns:
                diffs = []
                for _, row in resolved.iterrows():
                    try:
                        c = datetime.fromisoformat(str(row["created_at"]).replace("Z", "+00:00"))
                        u = datetime.fromisoformat(str(row["updated_at"]).replace("Z", "+00:00"))
                        diff_days = (u - c).total_seconds() / 86400
                        if 0 < diff_days < 365:
                            diffs.append(diff_days)
                    except Exception:
                        pass
                if diffs:
                    avg_response_days = round(sum(diffs) / len(diffs), 1)
        except Exception:
            pass

    return {
        **health,
        "resolved_issues":       resolved_count,
        "hotspots":              hs_resp["hotspots"],
        "category_breakdown":    analytics_data["by_category"],
        "in_progress":           analytics_data["by_status"].get("in_progress", 0),
        "active_hotspots":       len(hs_resp["hotspots"]),
        "total_wards":           len(health["wards"]),
        "avg_response_days":     avg_response_days,
    }


# GET /api/dashboard/worker/{worker_id}  (keeps backward compat)
@router.get("/worker/{worker_id}")
def worker_dashboard(worker_id: str):
    df = read_csv("issues")
    if df.empty:
        return {"assigned_count": 0, "resolved_today": 0, "priority_queue": []}

    assigned = df[df["assigned_to"] == worker_id] if "assigned_to" in df.columns else df.iloc[0:0]

    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    resolved_today = 0
    if "resolved_at" in assigned.columns:
        resolved_today = int(assigned[assigned["resolved_at"].str.startswith(today, na=False)].shape[0])

    queue = assigned[assigned["status"].isin(["assigned","in_progress","open"])]
    if "risk_score" in queue.columns:
        queue = queue.copy()
        queue["_rs"] = queue["risk_score"].apply(lambda x: _safe_float(x))
        queue = queue.sort_values("_rs", ascending=False).drop(columns=["_rs"])

    return {
        "assigned_count":  len(assigned),
        "resolved_today":  resolved_today,
        "priority_queue":  [_clean_record(row) for row in queue.head(20).to_dict("records")],
    }


# GET /api/dashboard/citizen/{user_id}  (keeps backward compat)
@router.get("/citizen/{user_id}")
def citizen_dashboard(user_id: str):
    df = read_csv("issues")
    if df.empty:
        return {"total_reported": 0, "open": 0, "in_progress": 0, "resolved": 0, "recent_issues": []}

    mine = df[df["reporter_id"] == user_id] if "reporter_id" in df.columns else df.iloc[0:0]
    recent = mine.sort_values("created_at", ascending=False).head(5) if "created_at" in mine.columns else mine.head(5)

    return {
        "total_reported": len(mine),
        "open":           int((mine["status"] == "open").sum()),
        "in_progress":    int((mine["status"] == "in_progress").sum()),
        "resolved":       int((mine["status"] == "resolved").sum()),
        "recent_issues":  [_clean_record(row) for row in recent.to_dict("records")],
    }
