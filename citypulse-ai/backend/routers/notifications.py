"""
CityPulse AI — Notifications Router
In-memory notification store with persistence to CSV.
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from services.csv_store import read_csv, append_row, update_row, new_id, now_iso, CSV_FIELDS
import math

router = APIRouter()

# Add notifications to CSV_FIELDS
CSV_FIELDS["notifications"] = [
    "id", "user_id", "role", "type", "title", "message",
    "issue_id", "read", "created_at"
]


def _clean(row: dict) -> dict:
    return {k: "" if v is None or (isinstance(v, float) and math.isnan(v)) or v == "nan" else v
            for k, v in row.items()}


class NotificationCreate(BaseModel):
    user_id:  Optional[str] = None
    role:     Optional[str] = None
    type:     str  # "assignment", "status_update", "resolution", "alert"
    title:    str
    message:  str
    issue_id: Optional[str] = None


# ── POST /api/notifications ────────────────────────────────────────────────────
@router.post("/", status_code=201)
def create_notification(body: NotificationCreate):
    row = {
        "id":         new_id("NOT"),
        "user_id":    body.user_id or "",
        "role":       body.role or "",
        "type":       body.type,
        "title":      body.title,
        "message":    body.message,
        "issue_id":   body.issue_id or "",
        "read":       "false",
        "created_at": now_iso(),
    }
    append_row("notifications", row)
    return row


# ── GET /api/notifications ─────────────────────────────────────────────────────
@router.get("/")
def get_notifications(
    user_id: Optional[str] = Query(None),
    role:    Optional[str] = Query(None),
    unread:  bool          = Query(False),
    limit:   int           = Query(20, le=100),
):
    df = read_csv("notifications")
    if df.empty:
        return {"notifications": [], "unread_count": 0}

    if user_id and "user_id" in df.columns:
        # Get personal + role-broadcast notifications
        mask = (df["user_id"] == user_id)
        if role and "role" in df.columns:
            mask = mask | ((df["role"] == role) & (df["user_id"] == ""))
        df = df[mask]
    elif role and "role" in df.columns:
        df = df[df["role"] == role]

    if unread and "read" in df.columns:
        df = df[df["read"] == "false"]

    if "created_at" in df.columns:
        df = df.sort_values("created_at", ascending=False)

    unread_count = int((df["read"] == "false").sum()) if "read" in df.columns else 0
    items = [_clean(r) for r in df.head(limit).to_dict("records")]
    return {"notifications": items, "unread_count": unread_count}


# ── PATCH /api/notifications/{id}/read ────────────────────────────────────────
@router.patch("/{notification_id}/read")
def mark_read(notification_id: str):
    update_row("notifications", "id", notification_id, {"read": "true"})
    return {"message": "Marked as read"}


# ── PATCH /api/notifications/read-all ─────────────────────────────────────────
@router.patch("/read-all")
def mark_all_read(user_id: str = Query(...)):
    df = read_csv("notifications")
    if df.empty:
        return {"message": "No notifications"}
    from services.csv_store import write_csv
    if "user_id" in df.columns:
        mask = (df["user_id"] == user_id)
        df.loc[mask, "read"] = "true"
        write_csv("notifications", df)
    return {"message": "All marked as read"}


# ── Broadcast helper (used internally by other routers) ───────────────────────
def broadcast(role: str, ntype: str, title: str, message: str, issue_id: str = ""):
    """Broadcast a notification to all users of a given role."""
    append_row("notifications", {
        "id":         new_id("NOT"),
        "user_id":    "",
        "role":       role,
        "type":       ntype,
        "title":      title,
        "message":    message,
        "issue_id":   issue_id,
        "read":       "false",
        "created_at": now_iso(),
    })


def notify_user(user_id: str, ntype: str, title: str, message: str, issue_id: str = ""):
    """Send a notification to a specific user."""
    append_row("notifications", {
        "id":         new_id("NOT"),
        "user_id":    user_id,
        "role":       "",
        "type":       ntype,
        "title":      title,
        "message":    message,
        "issue_id":   issue_id,
        "read":       "false",
        "created_at": now_iso(),
    })
