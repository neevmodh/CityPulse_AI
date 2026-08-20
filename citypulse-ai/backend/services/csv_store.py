"""
CityPulse AI — CSV Store
All persistence through pandas + threading.Lock for concurrent-write safety.
"""
from __future__ import annotations

import pandas as pd
import threading
import os
import uuid
from datetime import datetime, timezone

DATA_DIR = os.getenv("DATA_DIR", "./data")
_lock = threading.Lock()

# ── CSV fieldnames (define once so empty files get proper headers) ─────────────
CSV_FIELDS: dict[str, list[str]] = {
    "users": ["id","name","email","password_hash","role","ward_id","department_id","created_at"],
    "issues": [
        "id","issue_code","reporter_id","category","description","image_path",
        "latitude","longitude","ward_id","severity","risk_score","priority",
        "status","assigned_to","department_id","created_at","updated_at",
    ],
    "reports": ["id","issue_id","citizen_id","image_path","description","latitude","longitude","created_at"],
    "voice_reports": ["id","issue_id","audio_path","transcript","transcript_language","translated_text","processing","created_at"],
    "ai_analyses": [
        "id","issue_id","model","category","confidence","severity","summary",
        "reasoning","recommended_action","raw_response","created_at",
    ],
    "risk_scores": [
        "id","issue_id","severity_score","exposure_score","location_score",
        "recurrence_score","weather_score","frequency_score","final_score",
        "priority","reasoning","created_at",
    ],
    "assignments": ["id","issue_id","department_id","officer_id","assigned_at","sla_deadline","status"],
    "issue_history": ["id","issue_id","old_status","new_status","changed_by","notes","timestamp"],
    "resolutions": [
        "id","issue_id","officer_id","before_image","after_image","latitude","longitude",
        "notes","started_at","completed_at","time_taken_hours","verification_status","verification_score","verification_reason","resolved_at",
    ],
    "hotspots": [
        "id","name","latitude","longitude","ward_id","issue_count",
        "avg_risk_score","trend","prediction","created_at",
    ],
    "wards": ["id","name","lat_center","lng_center","health_score","population","area_sqkm","councillor","total_issues","open_issues","resolved_issues"],
    "departments": ["id","name","category","sla_hours","head","email","phone","active_workers"],
}


def _path(filename: str) -> str:
    if not filename.endswith(".csv"):
        filename += ".csv"
    return os.path.join(DATA_DIR, filename)


def read_csv(filename: str) -> pd.DataFrame:
    """Read CSV as DataFrame. Returns empty DataFrame with correct columns if missing."""
    p = _path(filename)
    key = filename.replace(".csv", "")
    with _lock:
        if not os.path.exists(p) or os.path.getsize(p) == 0:
            cols = CSV_FIELDS.get(key, [])
            return pd.DataFrame(columns=cols)
        try:
            return pd.read_csv(p, dtype=str)
        except Exception:
            cols = CSV_FIELDS.get(key, [])
            return pd.DataFrame(columns=cols)


def write_csv(filename: str, df: pd.DataFrame) -> None:
    """Write DataFrame to CSV (overwrites)."""
    p = _path(filename)
    os.makedirs(DATA_DIR, exist_ok=True)
    with _lock:
        df.to_csv(p, index=False)


def append_row(filename: str, row: dict) -> dict:
    """Append a single row dict to CSV. Auto-generates id if missing."""
    if "id" not in row or not row["id"]:
        row["id"] = str(uuid.uuid4())[:8]
    df = read_csv(filename)
    new_row = pd.DataFrame([row])
    # Align columns
    for col in new_row.columns:
        if col not in df.columns:
            df[col] = ""
    df = pd.concat([df, new_row], ignore_index=True)
    write_csv(filename, df)
    return row


def update_row(filename: str, id_col: str, id_val: str, updates: dict) -> bool:
    """Update matching row(s) in CSV with given field:value updates."""
    df = read_csv(filename)
    if id_col not in df.columns:
        return False
    mask = df[id_col] == str(id_val)
    if not mask.any():
        return False
    for k, v in updates.items():
        if k not in df.columns:
            df[k] = ""
        df.loc[mask, k] = str(v) if v is not None else ""
    write_csv(filename, df)
    return True


def delete_row(filename: str, id_col: str, id_val: str) -> bool:
    """Delete row(s) matching id_col == id_val."""
    df = read_csv(filename)
    before = len(df)
    df = df[df[id_col] != str(id_val)]
    if len(df) < before:
        write_csv(filename, df)
        return True
    return False


def get_row(filename: str, id_col: str, id_val: str) -> dict | None:
    """Return first matching row as dict, or None."""
    df = read_csv(filename)
    if id_col not in df.columns:
        return None
    rows = df[df[id_col] == str(id_val)]
    if rows.empty:
        return None
    return rows.iloc[0].to_dict()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix: str = "") -> str:
    uid = str(uuid.uuid4()).replace("-", "")[:8].upper()
    return f"{prefix}{uid}" if prefix else uid
