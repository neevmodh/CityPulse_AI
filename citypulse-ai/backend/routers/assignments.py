from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.csv_store import read_csv, append_row, update_row, new_id, now_iso

router = APIRouter()


def _notify(officer_id: str, issue_id: str, issue_code: str, sla_hrs: int):
    """Fire-and-forget notification — import lazily to avoid circular deps."""
    try:
        from routers.notifications import notify_user, broadcast
        notify_user(
            officer_id,
            "assignment",
            f"New issue assigned: {issue_code}",
            f"You have been assigned issue {issue_code}. SLA: {sla_hrs}h.",
            issue_id,
        )
        broadcast(
            "admin",
            "assignment",
            f"Issue {issue_code} assigned",
            f"Issue {issue_code} has been assigned to officer {officer_id}.",
            issue_id,
        )
    except Exception:
        pass

class AssignRequest(BaseModel):
    issue_id:      str
    officer_id:    str
    department_id: str
    notes:         Optional[str] = ""

class StatusUpdate(BaseModel):
    status: str


# POST /api/assignments
@router.post("/", status_code=201)
def assign_issue(body: AssignRequest):
    # Validate issue exists
    df = read_csv("issues")
    if df.empty or (df["id"] == body.issue_id).sum() == 0:
        raise HTTPException(status_code=404, detail="Issue not found")

    # Get dept SLA
    dept_df  = read_csv("departments")
    sla_hrs  = 48
    if not dept_df.empty and "id" in dept_df.columns:
        drows = dept_df[dept_df["id"] == body.department_id]
        if not drows.empty:
            sla_hrs = int(drows.iloc[0].get("sla_hours", 48))

    from datetime import datetime, timezone, timedelta
    now      = datetime.now(timezone.utc)
    deadline = (now + timedelta(hours=sla_hrs)).isoformat()

    asgn_id = new_id("ASG")
    append_row("assignments", {
        "id":            asgn_id,
        "issue_id":      body.issue_id,
        "department_id": body.department_id,
        "officer_id":    body.officer_id,
        "assigned_at":   now.isoformat(),
        "sla_deadline":  deadline,
        "status":        "active",
    })

    # Update issue
    update_row("issues", "id", body.issue_id, {
        "assigned_to":   body.officer_id,
        "department_id": body.department_id,
        "status":        "assigned",
        "updated_at":    now_iso(),
    })

    # History
    append_row("issue_history", {
        "id":         new_id("HIS"),
        "issue_id":   body.issue_id,
        "old_status": "ai_analyzed",
        "new_status": "assigned",
        "changed_by": "admin",
        "notes":      f"Assigned to {body.department_id}. SLA: {sla_hrs}h. {body.notes or ''}".strip(),
        "timestamp":  now_iso(),
    })

    # Fire notification
    _notify(body.officer_id, body.issue_id, f"CP-{body.issue_id[:6].upper()}", sla_hrs)

    return {"assignment_id": asgn_id, "sla_deadline": deadline}


# PATCH /api/assignments/{id}
@router.patch("/{assignment_id}")
def update_assignment(assignment_id: str, body: StatusUpdate):
    df = read_csv("assignments")
    if df.empty or (df["id"] == assignment_id).sum() == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    update_row("assignments", "id", assignment_id, {"status": body.status})
    return {"message": "Assignment updated"}


# GET /api/assignments/issue/{issue_id}
@router.get("/issue/{issue_id}")
def get_by_issue(issue_id: str):
    df = read_csv("assignments")
    if df.empty or "issue_id" not in df.columns:
        return {"assignments": []}
    rows = df[df["issue_id"] == issue_id]
    return {"assignments": rows.to_dict("records")}


# GET /api/assignments/officer/{officer_id}
@router.get("/officer/{officer_id}")
def get_by_officer(officer_id: str):
    df = read_csv("assignments")
    if df.empty or "officer_id" not in df.columns:
        return {"assignments": []}
    rows = df[df["officer_id"] == officer_id]
    return {"assignments": rows.to_dict("records")}
