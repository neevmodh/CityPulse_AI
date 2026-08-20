"""
CityPulse AI — Workers / Departments Router
Handles worker listing, department management, and SLA tracking.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from services.csv_store import read_csv, append_row, update_row, new_id, now_iso
import math

router = APIRouter()


def _clean(row: dict) -> dict:
    return {k: "" if v is None or (isinstance(v, float) and math.isnan(v)) or v == "nan" else v
            for k, v in row.items()}


# ── GET /api/workers ──────────────────────────────────────────────────────────
@router.get("/")
def list_workers(
    role:       Optional[str] = Query(None),
    department: Optional[str] = Query(None),
):
    df = read_csv("users")
    if df.empty:
        return {"workers": []}

    # Filter to worker role
    if "role" in df.columns:
        df = df[df["role"] == "worker"]

    if department and "department_id" in df.columns:
        df = df[df["department_id"] == department]

    workers = []
    issues_df = read_csv("issues")
    for _, row in df.iterrows():
        w = _clean(row.to_dict())
        worker_id = w.get("id", "")
        # Attach live stats
        if not issues_df.empty and "assigned_to" in issues_df.columns:
            assigned = issues_df[issues_df["assigned_to"] == worker_id]
            w["active_issues"]   = int((assigned["status"].isin(["assigned","in_progress","open"])).sum())
            w["resolved_issues"] = int((assigned["status"] == "resolved").sum())
            w["total_issues"]    = len(assigned)
        else:
            w["active_issues"]   = 0
            w["resolved_issues"] = 0
            w["total_issues"]    = 0
        workers.append(w)

    return {"workers": workers}


# ── GET /api/workers/{id} ─────────────────────────────────────────────────────
@router.get("/{worker_id}")
def get_worker(worker_id: str):
    df = read_csv("users")
    if df.empty:
        raise HTTPException(status_code=404, detail="Worker not found")
    rows = df[df["id"] == worker_id]
    if rows.empty:
        raise HTTPException(status_code=404, detail="Worker not found")
    w = _clean(rows.iloc[0].to_dict())

    # Live issue stats
    issues_df = read_csv("issues")
    if not issues_df.empty and "assigned_to" in issues_df.columns:
        assigned = issues_df[issues_df["assigned_to"] == worker_id]
        w["active_issues"]   = int((assigned["status"].isin(["assigned","in_progress"])).sum())
        w["resolved_issues"] = int((assigned["status"] == "resolved").sum())
        w["total_issues"]    = len(assigned)
        w["issues"]          = [_clean(r) for r in assigned.to_dict("records")]
    else:
        w["active_issues"]   = 0
        w["resolved_issues"] = 0
        w["total_issues"]    = 0
        w["issues"]          = []
    return w


# ── GET /api/workers/departments/list ─────────────────────────────────────────
@router.get("/departments/list")
def list_departments():
    df = read_csv("departments")
    if df.empty:
        return {"departments": []}

    issues_df = read_csv("issues")
    departments = []
    for _, row in df.iterrows():
        dept = _clean(row.to_dict())
        dept_id = dept.get("id", "")
        if not issues_df.empty and "department_id" in issues_df.columns:
            dept_issues = issues_df[issues_df["department_id"] == dept_id]
            dept["total_issues"]    = len(dept_issues)
            dept["open_issues"]     = int((dept_issues["status"].isin(["assigned","in_progress","open"])).sum())
            dept["resolved_issues"] = int((dept_issues["status"] == "resolved").sum())
            # SLA compliance — count resolved within deadline
            dept["sla_compliance"]  = 85  # TODO: compute from actual timestamps
        else:
            dept["total_issues"]    = 0
            dept["open_issues"]     = 0
            dept["resolved_issues"] = 0
            dept["sla_compliance"]  = 100
        departments.append(dept)
    return {"departments": departments}


# ── GET /api/workers/performance/summary ─────────────────────────────────────
@router.get("/performance/summary")
def performance_summary():
    """Return per-worker performance metrics for admin leaderboard."""
    users_df  = read_csv("users")
    issues_df = read_csv("issues")
    resol_df  = read_csv("resolutions")

    if users_df.empty:
        return {"workers": []}

    workers_df = users_df[users_df["role"] == "worker"] if "role" in users_df.columns else users_df

    result = []
    for _, row in workers_df.iterrows():
        w = _clean(row.to_dict())
        wid = w.get("id", "")

        assigned_count  = 0
        resolved_count  = 0
        avg_resolve_hrs = 0.0

        if not issues_df.empty and "assigned_to" in issues_df.columns:
            assigned = issues_df[issues_df["assigned_to"] == wid]
            assigned_count  = len(assigned)
            resolved_count  = int((assigned["status"] == "resolved").sum())

        if not resol_df.empty and "officer_id" in resol_df.columns:
            my_res = resol_df[resol_df["officer_id"] == wid]
            if not my_res.empty and "time_taken_hours" in my_res.columns:
                valid = my_res["time_taken_hours"].apply(
                    lambda x: float(x) if str(x).replace(".","").isdigit() else None
                ).dropna()
                if len(valid) > 0:
                    avg_resolve_hrs = round(float(valid.mean()), 1)

        score = min(100, resolved_count * 10 + assigned_count * 2)
        result.append({
            **w,
            "assigned_count":   assigned_count,
            "resolved_count":   resolved_count,
            "avg_resolve_hours":avg_resolve_hrs,
            "performance_score":score,
        })

    result.sort(key=lambda x: x["resolved_count"], reverse=True)
    return {"workers": result}
